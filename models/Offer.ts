import mongoose, { Schema, models } from "mongoose";

const OfferSchema = new Schema(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },

    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerEmail: { type: String },

    amount: { type: Number, required: true }, // buyer offer
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "countered"],
      default: "pending",
    },

    counterAmount: { type: Number }, // admin counter offer
    notes: { type: String }, // optional internal note
  },
  { timestamps: true }
);

const Offer = models.Offer || mongoose.model("Offer", OfferSchema);
export default Offer;