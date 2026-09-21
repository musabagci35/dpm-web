import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import Car from "@/models/Car";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";
import { getAdminSession } from "@/lib/adminSession";

const LIST_LIMIT = 200;

/**
 * The dealership's shared conversation inbox — every conversation, any
 * context. Admins get read/reply access to marketplace and auction
 * conversations too (moderation/oversight), not just dealer-inventory ones;
 * unreadForAdmin is only ever set for dealer-inventory conversations (see
 * app/api/conversations/[id]/messages/route.ts) so the badge count reflects
 * conversations the dealership is actually expected to answer.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const conversations = await Conversation.find()
    .sort({ lastMessageAt: -1 })
    .limit(LIST_LIMIT)
    .lean();

  const customerIds = [...new Set(conversations.map((c) => String(c.customerId)))];
  const vehicleIds = [...new Set(conversations.filter((c) => c.vehicleId).map((c) => String(c.vehicleId)))];
  const listingIds = [...new Set(conversations.filter((c) => c.marketplaceListingId).map((c) => String(c.marketplaceListingId)))];
  const auctionIds = [...new Set(conversations.filter((c) => c.auctionId).map((c) => String(c.auctionId)))];

  const [customers, vehicles, listings, auctions, lastMessages] = await Promise.all([
    MarketplaceSeller.find({ _id: { $in: customerIds } }).select("email name phone").lean(),
    vehicleIds.length ? Car.find({ _id: { $in: vehicleIds } }).select("year make model trim").lean() : [],
    listingIds.length ? MarketplaceListing.find({ _id: { $in: listingIds } }).select("year make model trim").lean() : [],
    auctionIds.length ? AuctionListing.find({ _id: { $in: auctionIds } }).select("year make model trim").lean() : [],
    Message.aggregate([
      { $match: { conversationId: { $in: conversations.map((c) => c._id) } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$conversationId", text: { $first: "$text" }, senderType: { $first: "$senderType" }, createdAt: { $first: "$createdAt" } } },
    ]),
  ]);

  const customerMap = new Map(customers.map((c) => [String(c._id), c]));
  const vehicleMap = new Map(vehicles.map((v) => [String(v._id), v]));
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));
  const auctionMap = new Map(auctions.map((a) => [String(a._id), a]));
  const lastMessageMap = new Map(lastMessages.map((m: any) => [String(m._id), m]));

  function vehicleLabel(v: any): string {
    if (!v) return "";
    return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
  }

  const result = conversations.map((c) => {
    const context = c.vehicleId
      ? { type: "vehicle" as const, id: String(c.vehicleId), label: vehicleLabel(vehicleMap.get(String(c.vehicleId))) }
      : c.marketplaceListingId
      ? { type: "marketplaceListing" as const, id: String(c.marketplaceListingId), label: vehicleLabel(listingMap.get(String(c.marketplaceListingId))) }
      : { type: "auction" as const, id: String(c.auctionId), label: vehicleLabel(auctionMap.get(String(c.auctionId))) };

    const customer = customerMap.get(String(c.customerId));
    const lastMessage = lastMessageMap.get(String(c._id));

    return {
      ...c,
      context,
      customerName: customer?.name || customer?.email || "Customer",
      customerEmail: customer?.email || "",
      lastMessage: lastMessage ? { text: lastMessage.text, senderType: lastMessage.senderType, createdAt: lastMessage.createdAt } : null,
    };
  });

  return NextResponse.json({ conversations: result });
}
