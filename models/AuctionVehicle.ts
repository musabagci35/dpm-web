import mongoose, { Schema, models, model } from "mongoose";

const AuctionVehicleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    vin: { type: String, trim: true, uppercase: true, index: true },

    year: { type: Number, required: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    trim: { type: String, default: "", trim: true },

    auctionName: { type: String, required: true, trim: true }, // Manheim, Copart, IAA, ACV
    location: { type: String, default: "", trim: true },
    lane: { type: String, default: "", trim: true },
    runNumber: { type: String, default: "", trim: true },
    saleDate: { type: Date },

    mileage: { type: Number, default: 0 },
    condition: { type: String, default: "", trim: true },
    damage: { type: String, default: "", trim: true },
    announcements: { type: String, default: "", trim: true },

    mmr: { type: Number, default: 0 },
    currentBid: { type: Number, default: 0 },
    maxBid: { type: Number, default: 0 },
    retailPrice: { type: Number, default: 0 },

    auctionFee: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    repairCost: { type: Number, default: 0 },
    detailCost: { type: Number, default: 0 },
    registrationCost: { type: Number, default: 0 },

    images: [{ type: String }],
    status: {
      type: String,
      enum: ["watching", "bidding", "purchased", "passed", "sold"],
      default: "watching",
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.AuctionVehicle ||
  model("AuctionVehicle", AuctionVehicleSchema);