import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
    },

    customerName: String,
    phone: String,
    email: String,

    appointmentDate: Date,

    notes: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
      ],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default
  mongoose.models.Appointment ||
  mongoose.model(
    "Appointment",
    appointmentSchema
  );