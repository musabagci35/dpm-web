import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { getSellerSession } from "@/lib/sellerSession";
import { getStripe, FEATURED_UPGRADE_FEE_CENTS } from "@/lib/stripe";
import { hasVerifiedContact, UNVERIFIED_CONTACT_ERROR } from "@/lib/sellerVerification";

/** Starts the optional $99 featured-upgrade Stripe Checkout. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  await connectDB();
  const listing = await MarketplaceListing.findById(id);

  if (!listing || String(listing.sellerId) !== String(session.sellerId)) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const seller = await MarketplaceSeller.findById(session.sellerId).select(
    "emailVerified phoneVerified"
  );
  if (!seller || !hasVerifiedContact(seller)) {
    return NextResponse.json({ error: UNVERIFIED_CONTACT_ERROR }, { status: 403 });
  }

  if (listing.featured) {
    return NextResponse.json({ error: "This listing is already featured." }, { status: 409 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const returnScheme = String(body.returnScheme || "driveprimemotors");

  const title = [listing.year, listing.make, listing.model, listing.trim]
    .filter(Boolean)
    .join(" ") || "Vehicle listing";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: FEATURED_UPGRADE_FEE_CENTS,
          product_data: {
            name: `Featured listing upgrade — ${title}`,
            description: "Priority placement for your Drive Prime Motors marketplace listing.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { listingId: String(listing._id), type: "featured" },
    success_url: `${returnScheme}://marketplace/checkout-result?status=success&listingId=${listing._id}&type=featured`,
    cancel_url: `${returnScheme}://marketplace/checkout-result?status=cancel&listingId=${listing._id}&type=featured`,
  });

  listing.featuredPayment.stripeCheckoutSessionId = checkoutSession.id;
  await listing.save();

  return NextResponse.json({ url: checkoutSession.url });
}
