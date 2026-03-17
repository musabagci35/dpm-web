import mongoose, { Schema, models, model } from "mongoose";

const DealerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    subdomain: { type: String, trim: true, unique: true, sparse: true, index: true },

    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const Dealer = models.Dealer || model("Dealer", DealerSchema);
export default Dealer;

