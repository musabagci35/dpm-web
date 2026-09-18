import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe webhook — the only place a listing's payment status is ever
 * actually confirmed. The checkout-creation routes only ever move a
 * listing to "payment_pending"; only a verified "checkout.session.completed"
 * event here moves it on to "pending_review" (or marks it featured).
 */
export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      payment_intent: string | null;
      amount_total: number | null;
      currency: string | null;
      metadata: { listingId?: string; type?: string } | null;
    };

    const listingId = session.metadata?.listingId;
    const type = session.metadata?.type;

    if (listingId) {
      await connectDB();
      const listing = await MarketplaceListing.findById(listingId);

      if (listing) {
        if (type === "featured") {
          listing.featured = true;
          listing.featuredPayment = {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || "",
            amountPaidCents: session.amount_total || 0,
            currency: session.currency || "usd",
            paidAt: new Date(),
          };
        } else if (listing.status === "payment_pending") {
          // Only advance from payment_pending — never re-process a listing
          // that's already moved on (a retried/duplicate webhook delivery
          // must not knock a live or reviewed listing back in the flow).
          listing.status = "pending_review";
          listing.payment = {
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || "",
            amountPaidCents: session.amount_total || 0,
            currency: session.currency || "usd",
            paidAt: new Date(),
          };
        }
        await listing.save();
      }
    }
  }

  return NextResponse.json({ received: true });
}
