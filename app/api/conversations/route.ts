import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Car from "@/models/Car";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { getSellerSession } from "@/lib/sellerSession";

function isValidId(value: unknown): value is string {
  return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Creates a new conversation, or returns the existing one the caller
 * already has about this exact context, for exactly one of
 * vehicleId / marketplaceListingId / auctionId. Never reopens a closed
 * conversation here — that only happens when a new message is actually
 * sent to it (see app/api/conversations/[id]/messages/route.ts).
 */
export async function POST(req: Request) {
  const sellerSession = await getSellerSession();
  if (!sellerSession) {
    return NextResponse.json({ error: "Sign in to start a conversation." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { vehicleId, marketplaceListingId, auctionId } = body || {};
  const provided = [vehicleId, marketplaceListingId, auctionId].filter(Boolean);
  if (provided.length !== 1) {
    return NextResponse.json(
      { error: "Provide exactly one of vehicleId, marketplaceListingId, or auctionId." },
      { status: 400 }
    );
  }

  await connectDB();

  const customerId = String(sellerSession.sellerId);
  let sellerId: string | null = null;

  if (vehicleId) {
    if (!isValidId(vehicleId)) {
      return NextResponse.json({ error: "Invalid vehicle id" }, { status: 400 });
    }
    const car = await Car.findById(vehicleId).select("_id status").lean();
    if (!car || (car as any).status === "archived") {
      return NextResponse.json({ error: "This vehicle isn't available to message about." }, { status: 404 });
    }
  } else if (marketplaceListingId) {
    if (!isValidId(marketplaceListingId)) {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }
    const listing = await MarketplaceListing.findById(marketplaceListingId)
      .select("_id status adminHidden sellerId")
      .lean();
    if (!listing || (listing as any).status !== "live" || (listing as any).adminHidden) {
      return NextResponse.json({ error: "This listing isn't available to message about." }, { status: 404 });
    }
    sellerId = String((listing as any).sellerId);
    if (sellerId === customerId) {
      return NextResponse.json({ error: "You can't message yourself about your own listing." }, { status: 400 });
    }
  } else {
    if (!isValidId(auctionId)) {
      return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
    }
    const auction = await AuctionListing.findById(auctionId)
      .select("_id status adminHidden sellerId")
      .lean();
    if (!auction || (auction as any).status !== "live" || (auction as any).adminHidden) {
      return NextResponse.json({ error: "This auction isn't available to message about." }, { status: 404 });
    }
    sellerId = String((auction as any).sellerId);
    if (sellerId === customerId) {
      return NextResponse.json({ error: "You can't message yourself about your own auction." }, { status: 400 });
    }
  }

  const contextQuery: Record<string, unknown> = { customerId };
  if (vehicleId) contextQuery.vehicleId = vehicleId;
  if (marketplaceListingId) contextQuery.marketplaceListingId = marketplaceListingId;
  if (auctionId) contextQuery.auctionId = auctionId;

  let conversation = await Conversation.findOne(contextQuery);
  if (!conversation) {
    conversation = await Conversation.create({
      customerId,
      sellerId,
      vehicleId: vehicleId || null,
      marketplaceListingId: marketplaceListingId || null,
      auctionId: auctionId || null,
    });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}

function vehicleLabel(v: any): string {
  if (!v) return "";
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
}

/** Lists every conversation the signed-in account is a party to, as either customer or seller (the same account plays both roles). */
export async function GET() {
  const sellerSession = await getSellerSession();
  if (!sellerSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const sellerId = String(sellerSession.sellerId);
  const conversations = await Conversation.find({
    $or: [{ customerId: sellerId }, { sellerId }],
  })
    .sort({ lastMessageAt: -1 })
    .lean();

  const vehicleIds = [...new Set(conversations.filter((c) => c.vehicleId).map((c) => String(c.vehicleId)))];
  const listingIds = [...new Set(conversations.filter((c) => c.marketplaceListingId).map((c) => String(c.marketplaceListingId)))];
  const auctionIds = [...new Set(conversations.filter((c) => c.auctionId).map((c) => String(c.auctionId)))];
  const otherPartyIds = [
    ...new Set(
      conversations.map((c) => (String(c.customerId) === sellerId ? c.sellerId : c.customerId)).filter(Boolean).map(String)
    ),
  ];

  const [vehicles, listings, auctions, otherParties, lastMessages] = await Promise.all([
    vehicleIds.length ? Car.find({ _id: { $in: vehicleIds } }).select("year make model trim").lean() : [],
    listingIds.length ? MarketplaceListing.find({ _id: { $in: listingIds } }).select("year make model trim").lean() : [],
    auctionIds.length ? AuctionListing.find({ _id: { $in: auctionIds } }).select("year make model trim").lean() : [],
    otherPartyIds.length ? MarketplaceSeller.find({ _id: { $in: otherPartyIds } }).select("name").lean() : [],
    Message.aggregate([
      { $match: { conversationId: { $in: conversations.map((c) => c._id) } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$conversationId", text: { $first: "$text" }, senderType: { $first: "$senderType" }, createdAt: { $first: "$createdAt" } } },
    ]),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [String(v._id), v]));
  const listingMap = new Map(listings.map((l) => [String(l._id), l]));
  const auctionMap = new Map(auctions.map((a) => [String(a._id), a]));
  const otherPartyMap = new Map(otherParties.map((p) => [String(p._id), p]));
  const lastMessageMap = new Map(lastMessages.map((m: any) => [String(m._id), m]));

  const result = conversations.map((c) => {
    const isCustomer = String(c.customerId) === sellerId;
    const context = c.vehicleId
      ? { type: "vehicle" as const, id: String(c.vehicleId), label: vehicleLabel(vehicleMap.get(String(c.vehicleId))) || "Drive Prime Motors vehicle" }
      : c.marketplaceListingId
      ? { type: "marketplaceListing" as const, id: String(c.marketplaceListingId), label: vehicleLabel(listingMap.get(String(c.marketplaceListingId))) }
      : { type: "auction" as const, id: String(c.auctionId), label: vehicleLabel(auctionMap.get(String(c.auctionId))) };

    const otherPartyId = isCustomer ? c.sellerId : c.customerId;
    const otherParty = otherPartyId ? otherPartyMap.get(String(otherPartyId)) : null;
    // Never falls back to the other account's email — that's private contact
    // info the messaging feature has no business exposing to a counterparty
    // who hasn't been given it, unlike a listing's own seller-chosen
    // contactEmail/contactPhone fields.
    const counterpartyName = c.vehicleId && isCustomer ? "Drive Prime Motors" : otherParty?.name || (isCustomer ? "Seller" : "Buyer");
    const lastMessage = lastMessageMap.get(String(c._id));

    return {
      ...c,
      viewerRole: isCustomer ? "customer" : "seller",
      context,
      counterpartyName,
      lastMessage: lastMessage ? { text: lastMessage.text, senderType: lastMessage.senderType, createdAt: lastMessage.createdAt } : null,
    };
  });

  return NextResponse.json({ conversations: result });
}
