import mongoose, { Schema, models, model } from "mongoose";

/**
 * A private marketplace seller account — deliberately separate from
 * models/User.ts (Drive Prime Motors staff/admin accounts). Sellers never
 * get a role, never get admin/sales permissions, and staff credentials are
 * never valid here. Keeping these fully separate is what keeps "Sell My
 * Car" listings from ever being reachable through dealer-staff auth.
 */
const MarketplaceSellerSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const MarketplaceSeller =
  models.MarketplaceSeller || model("MarketplaceSeller", MarketplaceSellerSchema);

export default MarketplaceSeller;
