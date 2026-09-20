import MarketplaceListing from "@/models/MarketplaceListing";

/**
 * No cron/background-job infrastructure exists in this deployment — same
 * lazy pattern as resolveDueAuctions(): any "live" listing whose
 * listingExpiresAt (30 days after going live) has passed is resolved to
 * "expired" the next time it's read, rather than on a schedule.
 */
export async function resolveDueListings(): Promise<void> {
  const now = new Date();

  await MarketplaceListing.updateMany(
    { status: "live", listingExpiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  );
}
