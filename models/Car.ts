import mongoose, { Schema, models, model } from "mongoose";

const CarSchema = new Schema(
{
title: { type: String, trim: true },

year: { type: Number, required: true },

make: { type: String, required: true, trim: true, index: true },

model: { type: String, required: true, trim: true, index: true },

trim: { type: String, trim: true },

titleStatus: { type: String, default: "unknown" },

salvage: { type: Boolean, default: false },

flood: { type: Boolean, default: false },

junk: { type: Boolean, default: false },

odometerStatus: { type: String, default: "unknown" },

price: { type: Number, required: true, index: true },

marketPrice: { type: Number, default: 0 },

mileage: { type: Number, default: 0, index: true },

vin: { type: String, trim: true, index: true },

stockNumber: { type: String, trim: true, index: true },

condition: { type: String, enum: ["new", "used"], default: "used" },

drivetrain: { type: String, trim: true },

transmission: { type: String, trim: true },

fuelType: { type: String, trim: true },

bodyStyle: { type: String, trim: true },

exteriorColor: { type: String, trim: true },

interiorColor: { type: String, trim: true },

description: { type: String, trim: true },

images: [
{
url: { type: String, required: true },
publicId: { type: String, default: "" },
},
],

auctionPhotos: [
{
url: { type: String, required: true },
source: { type: String, default: "marketcheck" },
},
],

vehicleHistory: {
title: { type: String, default: "unknown" },
odometer: { type: String, default: "unknown" },
accidents: { type: Number, default: 0 },
salvage: { type: Boolean, default: false },
flood: { type: Boolean, default: false },
junk: { type: Boolean, default: false },
},

facebookListing: {
posted: { type: Boolean, default: false },
productId: { type: String, default: "" },
lastPostedAt: { type: Date, default: null },
},

dealerId: {
type: mongoose.Schema.Types.ObjectId,
ref: "Dealer",
required: true,
index: true,
},

isActive: { type: Boolean, default: true, index: true },

isFeatured: { type: Boolean, default: false, index: true },

marketing: {
facebookPosted: { type: Boolean, default: false },
craigslistReady: { type: Boolean, default: false },
offerupReady: { type: Boolean, default: false },
marketplaceReady: { type: Boolean, default: false },
googleIndexed: { type: Boolean, default: false },
lastMarketingRunAt: { type: Date, default: null },
},
},
{ timestamps: true }
);

CarSchema.index({ make: 1, model: 1, price: 1, mileage: 1, isActive: 1 });

CarSchema.index(
{ dealerId: 1, vin: 1 },
{ unique: true, partialFilterExpression: { vin: { $exists: true, $ne: "" } } }
);

const Car = models.Car || model("Car", CarSchema);

export default Car;