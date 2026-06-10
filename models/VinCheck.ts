import mongoose from "mongoose";

const VinCheckSchema = new mongoose.Schema(
  {
    vin: { type: String, required: true },
    result: { type: Object, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.VinCheck ||
  mongoose.model("VinCheck", VinCheckSchema);