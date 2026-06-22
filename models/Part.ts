import mongoose, { Schema, models } from "mongoose";

const PartSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    partNumber: { type: String, default: "" },
    oemNumber: { type: String, default: "" },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      default: "",
    },

    condition: {
      type: String,
      enum: ["new", "used", "rebuilt", "unknown"],
      default: "used",
    },

    category: {
      type: String,
      enum: [
        "engine",
        "transmission",
        "body",
        "lighting",
        "wheels",
        "interior",
        "electronics",
        "suspension",
        "other",
      ],
      default: "other",
    },

    compatibility: { type: String, default: "" },

    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },

    description: { type: String, default: "" },

    images: { type: Array, default: [] },

    isActive: { type: Boolean, default: true },
    ebayUrl: {
      type: String,
      default: "",
    },
    // eBay Integration
    ebayItemId: {
      type: String,
      default: "",
    },

    ebayStatus: {
      type: String,
      enum: [
        "not_listed",
        "listed",
        "ended",
        "error",
      ],
      default: "not_listed",
    },

    ebayLastSyncedAt: {
      type: Date,
      default: null,
    },

    ebayError: {
      type: String,
      default: "",
    },
    // Auto Pricing

autoReprice: {
  type: Boolean,
  default: false,
},

minPrice: {
  type: Number,
  default: 0,
},

targetPrice: {
  type: Number,
  default: 0,
},

undercutAmount: {
  type: Number,
  default: 1,
},

lastCompetitorPrice: {
  type: Number,
  default: 0,
},

lastRepricedAt: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

export default models.Part || mongoose.model("Part", PartSchema);