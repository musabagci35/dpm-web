import mongoose, { Schema, models, model } from "mongoose";

const LeadSchema = new Schema(
  {
    // 🔑 Dealer bağlantısı (multi dealer system için şart)
    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      index: true,
    },

    // 🚗 Araç bağlantısı (opsiyonel)
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      default: null,
    },

    vin: {
      type: String,
      default: "",
      index: true,
    },

    carTitle: {
      type: String,
      default: "",
    },

    // 👤 CUSTOMER INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
    },

    message: {
      type: String,
      default: "",
    },

    // 📊 LEAD SOURCE
    source: {
      type: String,
      enum: ["website", "inventory", "vin", "facebook", "walkin"],
      default: "website",
    },

    // 📈 SALES PIPELINE
    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "appointment",
        "won",
        "lost",
      ],
      default: "new",
      index: true,
    },

    // 📝 SALES NOTES
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 PERFORMANCE INDEXES
LeadSchema.index({ dealerId: 1, createdAt: -1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ status: 1 });

const Lead = models.Lead || model("Lead", LeadSchema);

export default Lead;