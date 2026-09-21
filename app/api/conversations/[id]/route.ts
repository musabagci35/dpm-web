import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import { resolveConversationParty } from "@/lib/conversationAccess";

type RouteContext = { params: Promise<{ id: string }> };

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

  return NextResponse.json({ conversation, viewerRole: party.role });
}
