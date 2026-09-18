import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getSellerSession } from "@/lib/sellerSession";
import { getStripe, LISTING_FEE_CENTS } from "@/lib/stripe";

/**
 * Starts the $49 listing-fee Stripe Checkout for the seller's own draft.
 * The listing only moves to "pending_review" once the webhook confirms
 * payment actually completed — this route only ever gets it to
 * "payment_pending".
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to submit your listing." }, { status: 401 });
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

  if (listing.status !== "draft") {
    return NextResponse.json(
      { error: `This listing is already ${listing.status.replace("_", " ")}.` },
      { status: 409 }
    );
  }

  if (!listing.mileage && listing.mileage !== 0) {
    return NextResponse.json({ error: "Enter the vehicle's mileage first." }, { status: 400 });
  }
  if (!listing.price) {
    return NextResponse.json({ error: "Enter an asking price first." }, { status: 400 });
  }
  if (!listing.images?.length) {
    return NextResponse.json({ error: "Add at least one photo first." }, { status: 400 });
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
          unit_amount: LISTING_FEE_CENTS,
          product_data: {
            name: `Sell My Car listing fee — ${title}`,
            description: "30-day private-seller marketplace listing on Drive Prime Motors.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { listingId: String(listing._id), type: "listing_fee" },
    success_url: `${returnScheme}://marketplace/checkout-result?status=success&listingId=${listing._id}&type=listing_fee`,
    cancel_url: `${returnScheme}://marketplace/checkout-result?status=cancel&listingId=${listing._id}&type=listing_fee`,
  });

  listing.status = "payment_pending";
  listing.payment.stripeCheckoutSessionId = checkoutSession.id;
  await listing.save();

  return NextResponse.json({ url: checkoutSession.url });
}
