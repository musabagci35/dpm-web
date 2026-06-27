import mongoose, { Schema, models, model } from "mongoose";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

const MarketingSchema = new Schema(
  {
    facebookPosted: { type: Boolean, default: false },
    craigslistReady: { type: Boolean, default: false },
    offerupReady: { type: Boolean, default: false },
    marketplaceReady: { type: Boolean, default: false },
    googleIndexed: { type: Boolean, default: false },
    lastMarketingRunAt: { type: Date, default: null },
  },
  { _id: false }
);

const CarSchema = new Schema(
  {
    title: { type: String, trim: true },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },

    year: { type: Number, required: true, index: true },
    make: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    trim: { type: String, trim: true, default: "" },

    price: { type: Number, required: true, index: true },
    mileage: { type: Number, default: 0, index: true },
    vin: { type: String, trim: true, uppercase: true, sparse: true, index: true },
    titleStatus: {
      type: String,
      enum: ["clean", "salvage", "rebuilt", "parts_only", "unknown"],
      default: "unknown",
      index: true,
    },
    
    titleCode: { type: String, trim: true, default: "" },
    auctionHouse: {
      type: String,
      enum: ["copart", "manheim", "iaai", ""],
      default: "",
      index: true,
    },
    
    lotNumber: { type: String, trim: true, default: "" },
    primaryDamage: { type: String, trim: true, default: "" },
    secondaryDamage: { type: String, trim: true, default: "" },
    odometerStatus: { type: String, trim: true, default: "" },
    estimatedRetailValue: { type: Number, default: 0 },
    saleDate: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    
    runAndDrive: { type: Boolean, default: false },
    engineStarts: { type: Boolean, default: false },
    transmissionEngages: { type: Boolean, default: false },

    description: { type: String, trim: true, default: "" },
    videoUrl: { type: String, trim: true, default: "" },

    images: [ImageSchema],

    status: {
      type: String,
      enum: ["available", "pending", "sold", "archived"],
      default: "available",
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },

    // VIN Intelligence
    engine: { type: String, trim: true, default: "" },
    transmission: { type: String, trim: true, default: "" },
    drivetrain: { type: String, trim: true, default: "" },
    fuelType: { type: String, trim: true, default: "" },
    bodyClass: { type: String, trim: true, default: "" },

    // Profit Calculator
    cost: { type: Number, default: 0 },
    recon: { type: Number, default: 0 },
    auctionFee: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    registrationFee: { type: Number, default: 0 },
    smogFee: { type: Number, default: 0 },
    detailCost: { type: Number, default: 0 },
    docFee: { type: Number, default: 0 },
    salesTax: { type: Number, default: 0 },

    expectedRetail: { type: Number, default: 0 },
    totalInvestment: { type: Number, default: 0 },
    expectedProfit: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },

    // AI Dealer Assistant
    buyLimit: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
    aiRecommendation: {
      type: String,
      enum: ["BUY", "PASS", "WATCH", ""],
      default: "",
    },
    aiNotes: { type: String, trim: true, default: "" },

    marketing: { type: MarketingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

function makeSlug(doc: any) {
  const base =
    `${doc.year || ""}-${doc.make || ""}-${doc.model || ""}-${doc.trim || ""}-${doc.vin || ""}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return base || undefined;
}

CarSchema.pre("save", function () {
  if (this.images?.length > 0 && !this.images.some((i: any) => i.isCover)) {
    this.images[0].isCover = true;
  }

  if (!this.slug) {
    this.slug = makeSlug(this);
  }

  if (this.status === "sold" || this.status === "archived") {
    this.isActive = false;
  }
});

CarSchema.pre("findOneAndUpdate", function () {
  const update: any = this.getUpdate();

  if (update?.status === "sold" || update?.status === "archived") {
    update.isActive = false;
  }

  this.setUpdate(update);
});

const Car = models.Car || model("Car", CarSchema);

export default Car;