import mongoose, { Schema, models, model } from "mongoose";

const VinHistorySchema = new Schema(
{
vin: {
type: String,
required: true,
trim: true,
uppercase: true,
index: true,
},

make: {
type: String,
trim: true,
index: true,
},

model: {
type: String,
trim: true,
index: true,
},

year: {
type: Number,
index: true,
},

decodedAt: {
type: Date,
default: Date.now,
},

},
{ timestamps: true }
);

// make + model arama hızlandırma
VinHistorySchema.index({ make: 1, model: 1 });

const VinHistory =
models.VinHistory || model("VinHistory", VinHistorySchema);

export default VinHistory;