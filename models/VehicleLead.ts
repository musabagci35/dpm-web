import mongoose from "mongoose";

const VehicleLeadSchema = new mongoose.Schema(
  {
    carTitle: String,
    name: String,
    phone: String,
    email: String,
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

export default mongoose.models.VehicleLead ||
  mongoose.model("VehicleLead", VehicleLeadSchema);