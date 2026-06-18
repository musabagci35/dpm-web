import mongoose from "mongoose";

const VehicleLeadSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,

    vin: String,
    year: String,
    make: String,
    model: String,
    mileage: String,
    price: String,
    message: String,

    images: [String],
    source: { type: String, default: "sell-your-car" },
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

export default mongoose.models.VehicleLead ||
  mongoose.model("VehicleLead", VehicleLeadSchema);