import mongoose, { Schema, models, model } from "mongoose";

/**
 * A private-seller "Sell My Car" marketplace listing. Deliberately its own
 * model/collection — never mixed with models/Car.ts (Drive Prime Motors'
 * own dealer inventory). A listing here is never dealer-owned stock; it is
 * always a private individual's vehicle that Drive Prime Motors is only
 * hosting a paid listing for.
 */

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

/** At most one per listing — a single nested subdocument, not an array. */
const VideoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    /** Milliseconds — used to enforce the 60s cap and to show a duration badge. */
    durationMs: { type: Number, default: 0 },
    /** A cover photo (never the seller's video itself) used as the poster frame. */
    thumbnailUrl: { type: String, default: "" },
  },
  { _id: false }
);

const ReportSchema = new Schema(
  {
    reason: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    reportedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    stripeCheckoutSessionId: { type: String, default: "" },
    stripePaymentIntentId: { type: String, default: "" },
    amountPaidCents: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
);

const MarketplaceListingSchema = new Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MarketplaceSeller",
      required: true,
      index: true,
    },

    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },

    // Factory data — filled from the VIN decode and never hand-edited by the
    // seller beyond what the decode returned.
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

    // Always seller-entered by hand — never inferred from the VIN, which has
    // no odometer, title, accident or ownership data.
    mileage: { type: Number, required: true, min: 0 },
    titleStatus: {
      type: String,
      enum: ["clean", "salvage", "rebuilt", "title_pending", "unknown"],
      default: "unknown",
      required: true,
    },

    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "" },

    contactName: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    contactEmail: { type: String, trim: true, default: "" },
    contactPreference: {
      type: String,
      enum: ["phone", "email", "either"],
      default: "either",
    },

    images: { type: [ImageSchema], default: [] },
    video: { type: VideoSchema, default: null },

    status: {
      type: String,
      enum: [
        "draft",
        "payment_pending",
        "pending_review",
        "live",
        "rejected",
        "sold",
        "expired",
      ],
      default: "draft",
      index: true,
    },

    payment: { type: PaymentSchema, default: () => ({}) },

    featured: { type: Boolean, default: false, index: true },
    featuredPayment: { type: PaymentSchema, default: () => ({}) },

    /** Set once the listing goes live: now + 30 days. */
    listingExpiresAt: { type: Date, default: null, index: true },

    // Moderation.
    rejectionReason: { type: String, trim: true, default: "" },
    flagged: { type: Boolean, default: false, index: true },
    flagReason: { type: String, trim: true, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },

    reports: { type: [ReportSchema], default: [] },

    /** Marked by a clearly-labeled test seller/vehicle for this first version's dry runs. */
    isTest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function makeSlug(doc: any) {
  const base = `${doc.year || ""}-${doc.make || ""}-${doc.model || ""}-${Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || undefined;
}

MarketplaceListingSchema.pre("save", function () {
  if (this.images?.length > 0 && !this.images.some((i: any) => i.isCover)) {
    this.images[0].isCover = true;
  }
  if (!this.slug) {
    this.slug = makeSlug(this);
  }
});

const MarketplaceListing =
  models.MarketplaceListing || model("MarketplaceListing", MarketplaceListingSchema);

export default MarketplaceListing;
