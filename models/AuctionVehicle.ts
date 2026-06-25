import mongoose, { Schema, models, model } from "mongoose";

const AuctionVehicleSchema = new Schema(
  {
    auction: {
      type: String,
      enum: ["copart", "manheim", "iaai", "adesa", "acv", "other"],
      default: "copart",
      index: true,
    },

    lotNumber: { type: String, trim: true, default: "", index: true },
    vin: { type: String, trim: true, uppercase: true, default: "", index: true },

    year: { type: Number, default: 0, index: true },
    make: { type: String, trim: true, default: "", index: true },
    model: { type: String, trim: true, default: "", index: true },
    trim: { type: String, trim: true, default: "" },

    titleStatus: { type: String, trim: true, default: "unknown" },
    damageType: { type: String, trim: true, default: "" },
    runAndDrive: { type: Boolean, default: false },
    hasKeys: { type: Boolean, default: false },

    auctionDate: { type: Date, default: null },
    auctionUrl: { type: String, trim: true, default: "" },

    currentBid: { type: Number, default: 0 },
    buyNowPrice: { type: Number, default: 0 },
    auctionFees: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },
    repairEstimate: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },

    targetRetailPrice: { type: Number, default: 0 },
    maxBid: { type: Number, default: 0 },
    estimatedProfit: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },

    decision: {
      type: String,
      enum: ["watch", "bid", "pass", "purchased"],
      default: "watch",
      index: true,
    },

    notes: { type: String, default: "" },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

AuctionVehicleSchema.pre("save", function () {
  const bid = this.buyNowPrice || this.currentBid || 0;

  this.totalCost =
    bid +
    (this.auctionFees || 0) +
    (this.transportCost || 0) +
    (this.repairEstimate || 0) +
    (this.otherCost || 0);

  this.estimatedProfit = (this.targetRetailPrice || 0) - this.totalCost;
});

const AuctionVehicle =
  models.AuctionVehicle || model("AuctionVehicle", AuctionVehicleSchema);

export default AuctionVehicle;
