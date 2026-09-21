import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message, { MAX_MESSAGE_LENGTH } from "@/models/Message";
import { resolveConversationParty } from "@/lib/conversationAccess";
import { rateLimit } from "@/lib/rateLimit";

type RouteContext = { params: Promise<{ id: string }> };

/** Most recent messages first fetched, then reversed to chronological order for the thread UI. No cursor pagination yet — see the Phase 1 report for this limitation. */
const MESSAGE_LIST_LIMIT = 200;

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  await connectDB();
  const conversation = await Conversation.findById(id).lean();
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const party = await resolveConversationParty(conversation as any);
  if (!party) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await Message.find({ conversationId: id })
    .sort({ createdAt: -1 })
    .limit(MESSAGE_LIST_LIMIT)
    .lean();

  return NextResponse.json({ messages: messages.reverse(), viewerRole: party.role });
}

/**
 * senderType and senderId are always derived from the resolved session —
 * never taken from the request body, so a client can never spoof who a
 * message is from. A frozen/suspended/deleted seller is blocked here
 * automatically: getSellerSession() (inside resolveConversationParty)
 * already returns null for any non-active MarketplaceSeller, which makes
 * `party` null and this request 401.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  await connectDB();
  const conversation = await Conversation.findById(id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const party = await resolveConversationParty(conversation as any);
  if (!party) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body?.text || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message can't be longer than ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
  }

  const limited = rateLimit(`message-send:${party.senderId}`, 30, 5 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "You're sending messages too quickly. Please wait a moment." }, { status: 429 });
  }

  const message = await Message.create({
    conversationId: id,
    senderType: party.role,
    senderId: party.senderId,
    text,
  });

  conversation.lastMessageAt = new Date();
  // Any new message reopens a closed thread — matches ordinary chat/ticket
  // behavior; an admin who wants a conversation to stay closed uses the
  // dedicated close action again afterward.
  if (conversation.status === "closed") {
    conversation.status = "open";
  }

  if (party.role === "customer" && conversation.vehicleId) {
    conversation.unreadForAdmin = true;
  }
  if (party.role === "customer" && conversation.sellerId) {
    conversation.unreadForSeller = true;
  }
  if (party.role === "admin") {
    conversation.unreadForAdmin = false;
    conversation.adminId = new mongoose.Types.ObjectId(party.senderId);
    conversation.humanTakeover = true;
  }
  if (party.role === "seller") {
    conversation.unreadForSeller = false;
  }

  await conversation.save();

  return NextResponse.json({ message }, { status: 201 });
}
