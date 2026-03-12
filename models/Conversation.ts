import mongoose, { Schema, models } from "mongoose";

const ConversationSchema = new Schema(
  {
    carId: { type: Schema.Types.ObjectId, ref: "Car", required: true },

    buyerName: { type: String, required: true },
    buyerEmail: { type: String },
    buyerPhone: { type: String, required: true },

    // buyer access token hash (security)
    tokenHash: { type: String, required: true },

    lastMessageAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export default models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);