import AuctionListing from "@/models/AuctionListing";

/**
 * No cron/background-job infrastructure exists in this deployment, so —
 * same lazy pattern used for the 30-day marketplace listing expiry — any
 * "live" auction whose endsAt has passed is resolved to its final state
 * the next time it's read, rather than on a schedule. Also promotes a
 * "scheduled" auction whose startsAt has arrived to "live".
 */
export async function resolveDueAuctions(): Promise<void> {
  const now = new Date();

  await AuctionListing.updateMany(
    { status: "scheduled", startsAt: { $lte: now } },
    { $set: { status: "live" } }
  );

  const due = await AuctionListing.find({ status: "live", endsAt: { $lte: now } }).select(
    "_id currentBid reservePrice"
  );

  for (const auction of due) {
    const hasBids = auction.currentBid != null;
    const reserveMet = auction.reservePrice == null || (hasBids && auction.currentBid >= auction.reservePrice);
    const finalStatus = hasBids && reserveMet ? "sold" : hasBids ? "reserve_not_met" : "ended";
    await AuctionListing.updateOne({ _id: auction._id }, { $set: { status: finalStatus } });
  }
}
