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

    // 👤 CUSTOMER
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    // 📊 SOURCE
    source: {
      type: String,
      enum: ["website", "inventory", "vin", "facebook", "walkin"],
      default: "website",
      index: true,
    },

    // 🔥 SALES PIPELINE
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

    // 🧠 PRIORITY (AUTO SET)
    priority: {
      type: String,
      enum: ["cold", "warm", "hot"],
      default: "cold",
      index: true,
    },

    followUpDate: {
      type: Date,
      default: null,
    },

    lastContactedAt: {
      type: Date,
      default: null,
    },

    convertedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


// 🔥 SMART INDEXES (çok önemli performans)
LeadSchema.index({ dealerId: 1, createdAt: -1 });
LeadSchema.index({ dealerId: 1, phone: 1 }); // duplicate kontrol
LeadSchema.index({ status: 1, priority: 1 });
LeadSchema.index({ followUpDate: 1 });


// 🔥 AUTO PRIORITY (AI gibi çalışır)
LeadSchema.pre("save", function (next) {
  if (this.message?.toLowerCase().includes("price")) {
    this.priority = "hot";
  } else if (this.message?.length > 25) {
    this.priority = "warm";
  } else {
    this.priority = "cold";
  }
  next();
});


const Lead = models.Lead || model("Lead", LeadSchema);

export default Lead;