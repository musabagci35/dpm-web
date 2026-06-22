import mongoose, { Schema, models, model } from "mongoose";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    isCover: { type: Boolean, default: false },
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

    vin: { type: String, trim: true, index: true },

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

    cost: { type: Number, default: 0 },
    recon: { type: Number, default: 0 },
    marketing: {
      facebookPosted: {
        type: Boolean,
        default: false,
      },
      craigslistReady: {
        type: Boolean,
        default: false,
      },
      offerupReady: {
        type: Boolean,
        default: false,
      },
      marketplaceReady: {
        type: Boolean,
        default: false,
      },
      googleIndexed: {
        type: Boolean,
        default: false,
      },
      lastMarketingRunAt: {
        type: Date,
        default: null,
      },
    },
    docFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

function makeSlug(doc: any) {
  const base = `${doc.year || ""}-${doc.make || ""}-${doc.model || ""}-${doc.trim || ""}-${doc.vin || ""}`
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