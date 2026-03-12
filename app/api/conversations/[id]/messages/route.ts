import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();

  const msgs = await Message.find({ conversationId: id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(msgs);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { sender, text } = body;

    if (!sender || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectDB();

    // buyer security check
    if (sender === "buyer") {
      const token = req.headers.get("x-chat-token") || "";
      const convo = await Conversation.findById(id).lean();
      if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

      if (!token || sha256(token) !== convo.tokenHash) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await Message.create({
      conversationId: id,
      sender,
      text,
    });

    await Conversation.findByIdAndUpdate(id, { lastMessageAt: new Date() });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}