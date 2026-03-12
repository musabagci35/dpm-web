import mongoose, { Schema, models, model } from "mongoose";

const LeadSchema = new Schema(
  {
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      index: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    carTitle: {
      type: String,
      default: "",
    },
    customerName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "won", "lost"],
      default: "new",
    },
  },
  { timestamps: true }
);

const Lead = models.Lead || model("Lead", LeadSchema);

export default Lead;