import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";

/** Not-yet-final statuses a duplicate VIN check needs to catch — a sold/expired/rejected/cancelled one is no longer "in the marketplace" and shouldn't block a new listing. */
const ACTIVE_LISTING_STATUSES = ["draft", "payment_pending", "pending_review", "live"];
const ACTIVE_AUCTION_STATUSES = ["draft", "pending_review", "scheduled", "live", "paused"];

/** True if this VIN is already active in either a fixed-price listing or an auction, anywhere on the marketplace (not just this seller's own). */
export async function isVinAlreadyActive(vin: string): Promise<boolean> {
  const cleanVin = vin.trim().toUpperCase();
  if (!cleanVin) return false;

  const [listing, auction] = await Promise.all([
    MarketplaceListing.findOne({ vin: cleanVin, status: { $in: ACTIVE_LISTING_STATUSES } }).select("_id").lean(),
    AuctionListing.findOne({ vin: cleanVin, status: { $in: ACTIVE_AUCTION_STATUSES } }).select("_id").lean(),
  ]);

  return Boolean(listing || auction);
}

export const DUPLICATE_VIN_ERROR = "This VIN is already listed on the marketplace.";
