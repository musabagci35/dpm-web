import mongoose, { Schema, models, model } from "mongoose";

/**
 * A messaging thread about exactly one of: dealer inventory (vehicleId),
 * a "Sell My Car" listing (marketplaceListingId), or an auction (auctionId).
 *
 * There is no separate buyer/customer account model in this app — only
 * MarketplaceSeller (the "Sell My Car" account, already used for both
 * selling and bidding) and User (dealer staff). customerId therefore always
 * points at a MarketplaceSeller document, reused in a "customer" role when
 * that account is asking about a vehicle/listing/auction it doesn't own.
 * sellerId is set only when the context is someone's listing/auction (the
 * owner); it stays null for a dealer-inventory conversation, which the
 * dealership itself (any admin, via adminId once one takes it over) answers.
 */
const ConversationSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "MarketplaceSeller", default: null, index: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },

    vehicleId: { type: Schema.Types.ObjectId, ref: "Car", default: null, index: true },
    marketplaceListingId: { type: Schema.Types.ObjectId, ref: "MarketplaceListing", default: null, index: true },
    auctionId: { type: Schema.Types.ObjectId, ref: "AuctionListing", default: null, index: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },

    status: { type: String, enum: ["open", "escalated", "closed"], default: "open", index: true },

    /** Set once dealer staff (or the listing owner) has actually replied — reserved for the future AI-reply phase, unused as a gate in Phase 1. */
    humanTakeover: { type: Boolean, default: false },

    // Denormalized inbox badges for the two shared-inbox roles (admin's
    // dealership inbox, a seller's own inbox). The customer's own unread
    // state is computed on read from Message.readAt instead — a customer
    // only ever has a handful of conversations, so there's no volume
    // reason to denormalize a third flag for it.
    unreadForAdmin: { type: Boolean, default: false },
    unreadForSeller: { type: Boolean, default: false },

    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Exactly one context reference must be set.
ConversationSchema.pre("validate", function (next) {
  const contextCount = [this.vehicleId, this.marketplaceListingId, this.auctionId].filter(Boolean).length;
  if (contextCount !== 1) {
    return next(new Error("A conversation must reference exactly one of vehicleId, marketplaceListingId, or auctionId."));
  }
  next();
});

// Finds/reuses the one conversation a customer has about a given context.
ConversationSchema.index({ customerId: 1, vehicleId: 1 });
ConversationSchema.index({ customerId: 1, marketplaceListingId: 1 });
ConversationSchema.index({ customerId: 1, auctionId: 1 });
ConversationSchema.index({ sellerId: 1, status: 1 });

const Conversation = models.Conversation || model("Conversation", ConversationSchema);

export default Conversation;
