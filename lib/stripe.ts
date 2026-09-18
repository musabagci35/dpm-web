import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazily constructed so importing this file never throws — only actually
 * creating a checkout session does, with a clear message, if the test-mode
 * secret key hasn't been added to .env.local yet.
 */
export function getStripe(): Stripe {
  if (client) return client;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe TEST mode secret key to .env.local to enable marketplace checkout."
    );
  }

  client = new Stripe(secretKey);
  return client;
}

/** $49 flat listing fee, in cents, per the marketplace spec. */
export const LISTING_FEE_CENTS = 4900;

/** $99 optional featured-listing upgrade, in cents. */
export const FEATURED_UPGRADE_FEE_CENTS = 9900;

/** How long a listing stays live once approved, per the marketplace spec. */
export const LISTING_ACTIVE_DAYS = 30;
