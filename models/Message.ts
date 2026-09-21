import mongoose, { Schema, models, model } from "mongoose";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * senderId is a MarketplaceSeller._id for "customer"/"seller", or a
 * User._id for "admin" — never trusted from the client (see
 * app/api/conversations/[id]/messages/route.ts, which derives senderType
 * and senderId purely from the resolved session).
 */
const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderType: { type: String, enum: ["customer", "admin", "seller"], required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },

    text: { type: String, required: true, trim: true, maxlength: MAX_MESSAGE_LENGTH },

    /** Always false in this phase — reserved for the future AI-reply phase. */
    aiGenerated: { type: Boolean, default: false },

    readAt: { type: Date, default: null },
    status: { type: String, enum: ["sent", "delivered", "failed"], default: "sent" },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, readAt: 1 });

const Message = models.Message || model("Message", MessageSchema);

export default Message;
export { MAX_MESSAGE_LENGTH };
