import mongoose, { Schema, models, model } from "mongoose";

const ImageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
  isCover: { type: Boolean, default: false },
});

const CarSchema = new Schema(
  {
    title: { type: String, trim: true },

    year: { type: Number, required: true },
    make: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true, index: true },
    trim: { type: String, trim: true },

    price: { type: Number, required: true, index: true },
    mileage: { type: Number, default: 0, index: true },

    vin: { type: String, trim: true, index: true },

    description: { type: String, trim: true },

    images: [ImageSchema], // ✅ ONLY ONCE

    dealerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      index: true,
    },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);


// ✅ COVER AUTO FIX
CarSchema.pre("save", function (next) {
  if (this.images?.length > 0 && !this.images.some((i) => i.isCover)) {
    this.images[0].isCover = true;
  }
  next();
});

const Car = models.Car || model("Car", CarSchema);

export default Car;