import mongoose, { Schema, models, model } from "mongoose";
import { VehicleHistoryReportSchema } from "./VehicleHistoryReport";

/**
 * A private-seller auction listing. Its own collection — never mixed with
 * models/Car.ts (dealer inventory) or models/MarketplaceListing.ts
 * (fixed-price classifieds). Shares seller identity with
 * models/MarketplaceSeller.ts (the same account both sells and bids, the
 * same way a Copart/eBay account does).
 */

const ImageSchema = new Schema(
  { url: { type: String, required: true }, publicId: { type: String, default: "" }, isCover: { type: Boolean, default: false } },
  { _id: false }
);

const VideoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    durationMs: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: "" },
  },
  { _id: false }
);

/** Append-only — a bid is never edited or removed once placed. */
const BidSchema = new Schema(
  {
    bidderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true },
    amount: { type: Number, required: true },
    placedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReportSchema = new Schema(
  { reason: { type: String, trim: true, default: "" }, message: { type: String, trim: true, default: "" }, reportedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const AuctionListingSchema = new Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },

    // Factory data — from the VIN decode only, never hand-edited beyond it.
    vin: { type: String, trim: true, uppercase: true, default: "" },
    year: { type: Number, default: 0 },
    make: { type: String, trim: true, default: "" },
    model: { type: String, trim: true, default: "" },
    trim: { type: String, trim: true, default: "" },
    engine: { type: String, trim: true, default: "" },
    transmission: { type: String, trim: true, default: "" },
    drivetrain: { type: String, trim: true, default: "" },
    fuelType: { type: String, trim: true, default: "" },
    bodyClass: { type: String, trim: true, default: "" },

    // Always seller-entered — never inferred from the VIN.
    mileage: { type: Number, required: true, min: 0 },
    titleStatus: {
      type: String,
      enum: ["clean", "salvage", "rebuilt", "title_pending", "unknown"],
      default: "unknown",
      required: true,
    },

    description: { type: String, trim: true, default: "" },
    disclosures: { type: String, trim: true, default: "" },

    contactName: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    contactEmail: { type: String, trim: true, default: "" },
    contactPreference: { type: String, enum: ["phone", "email", "either"], default: "either" },

    images: { type: [ImageSchema], default: [] },
    video: { type: VideoSchema, default: null },
    vehicleHistoryReport: { type: VehicleHistoryReportSchema, default: () => ({}) },

    // Auction terms — set once at creation, immutable after submission.
    startingBid: { type: Number, required: true, min: 0 },
    reservePrice: { type: Number, default: null },
    bidIncrement: { type: Number, required: true, min: 1 },
    buyItNowPrice: { type: Number, default: null },
    durationHours: { type: Number, required: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null, index: true },

    // Live auction state.
    currentBid: { type: Number, default: null },
    currentBidderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", default: null },
    bidCount: { type: Number, default: 0 },
    bids: { type: [BidSchema], default: [] },

    status: {
      type: String,
      enum: ["draft", "pending_review", "scheduled", "live", "paused", "ended", "sold", "reserve_not_met", "cancelled"],
      default: "draft",
      index: true,
    },

    watchedBy: { type: [mongoose.Schema.Types.ObjectId], ref: "MarketplaceSeller", default: [] },

    // Moderation.
    rejectionReason: { type: String, trim: true, default: "" },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String, trim: true, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    reports: { type: [ReportSchema], default: [] },

    isTest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function makeSlug(doc: any) {
  const base = `${doc.year || ""}-${doc.make || ""}-${doc.model || ""}-auction-${Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || undefined;
}

AuctionListingSchema.pre("save", function () {
  if (this.images?.length > 0 && !this.images.some((i: any) => i.isCover)) {
    this.images[0].isCover = true;
  }
  if (!this.slug) {
    this.slug = makeSlug(this);
  }
});

AuctionListingSchema.index({ status: 1, endsAt: 1 });

const AuctionListing = models.AuctionListing || model("AuctionListing", AuctionListingSchema);

export default AuctionListing;
