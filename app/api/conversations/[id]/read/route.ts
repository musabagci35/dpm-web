import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { resolveConversationParty } from "@/lib/conversationAccess";

type RouteContext = { params: Promise<{ id: string }> };

/** Marks every message the viewer didn't send as read, and clears their inbox's unread flag for this conversation. */
export async function POST(_req: Request, { params }: RouteContext) {
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

  await Message.updateMany(
    { conversationId: id, senderType: { $ne: party.role }, readAt: null },
    { $set: { readAt: new Date() } }
  );

  if (party.role === "admin") conversation.unreadForAdmin = false;
  if (party.role === "seller") conversation.unreadForSeller = false;
  await conversation.save();

  return NextResponse.json({ success: true });
}
