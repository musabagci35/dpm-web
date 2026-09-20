import { hasPublicVehicleHistoryReport } from "@/models/VehicleHistoryReport";

/**
 * The only AuctionListing fields any public endpoint may return. The full
 * bidder identity behind each bid is deliberately reduced to a short
 * display label (never an email/phone) — bid history is public, bidder PII
 * is not. Payment/moderation-internal fields never appear here.
 */
export function toPublicAuctionListing(auction: any) {
  const report = auction.vehicleHistoryReport;
  return {
    _id: String(auction._id ?? ""),
    slug: String(auction.slug || auction._id || ""),
    vin: String(auction.vin || ""),
    year: Number(auction.year) || 0,
    make: String(auction.make || ""),
    model: String(auction.model || ""),
    trim: String(auction.trim || ""),
    engine: String(auction.engine || ""),
    transmission: String(auction.transmission || ""),
    drivetrain: String(auction.drivetrain || ""),
    fuelType: String(auction.fuelType || ""),
    bodyClass: String(auction.bodyClass || ""),
    mileage: Number(auction.mileage) || 0,
    titleStatus: String(auction.titleStatus || "unknown"),
    description: String(auction.description || ""),
    disclosures: String(auction.disclosures || ""),
    contactName: String(auction.contactName || ""),
    contactPhone: String(auction.contactPhone || ""),
    contactEmail: String(auction.contactEmail || ""),
    contactPreference: String(auction.contactPreference || "either"),
    images: Array.isArray(auction.images)
      ? auction.images.map((img: any) => ({ url: img.url, publicId: img.publicId || undefined, isCover: Boolean(img.isCover) }))
      : [],
    video: auction.video?.url
      ? { url: auction.video.url, thumbnailUrl: auction.video.thumbnailUrl || "", durationMs: Number(auction.video.durationMs) || 0 }
      : null,
    vehicleHistoryReport: hasPublicVehicleHistoryReport(report)
      ? { url: report.url, source: report.source, reportDate: report.reportDate }
      : null,
    startingBid: Number(auction.startingBid) || 0,
    hasReserve: auction.reservePrice != null,
    reserveMet:
      auction.reservePrice == null ||
      (auction.currentBid != null && auction.currentBid >= auction.reservePrice),
    bidIncrement: Number(auction.bidIncrement) || 0,
    buyItNowPrice: auction.buyItNowPrice != null ? Number(auction.buyItNowPrice) : null,
    durationHours: Number(auction.durationHours) || 0,
    startsAt: auction.startsAt ? new Date(auction.startsAt).toISOString() : null,
    endsAt: auction.endsAt ? new Date(auction.endsAt).toISOString() : null,
    currentBid: auction.currentBid != null ? Number(auction.currentBid) : null,
    nextMinBid:
      (auction.currentBid != null ? Number(auction.currentBid) : Number(auction.startingBid) || 0) +
      (auction.currentBid != null ? Number(auction.bidIncrement) || 0 : 0),
    bidCount: Number(auction.bidCount) || 0,
    bids: Array.isArray(auction.bids)
      ? auction.bids.map((b: any) => ({
          bidderLabel: bidderLabel(b.bidderId),
          amount: Number(b.amount) || 0,
          placedAt: new Date(b.placedAt).toISOString(),
        }))
      : [],
    status: String(auction.status || "draft"),
    isTest: Boolean(auction.isTest),
    createdAt: auction.createdAt ? new Date(auction.createdAt).toISOString() : undefined,
  };
}

function bidderLabel(bidderId: any): string {
  const idStr = String(bidderId?._id || bidderId || "");
  return idStr ? `Bidder #${idStr.slice(-4).toUpperCase()}` : "Bidder";
}

export type PublicAuctionListing = ReturnType<typeof toPublicAuctionListing>;
