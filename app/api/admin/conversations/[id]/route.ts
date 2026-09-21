import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { getAdminSession } from "@/lib/adminSession";

type RouteContext = { params: Promise<{ id: string }> };

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const ACTIONS = ["close", "reopen", "takeover"] as const;
type Action = (typeof ACTIONS)[number];

/** Admin-only conversation actions: close, reopen, take over. Every action is written to AuditLog, same as every other admin-moderation route. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action as Action;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await connectDB();
  const [conversation, admin] = await Promise.all([
    Conversation.findById(id),
    User.findById(session.userId).select("email role").lean(),
  ]);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (action === "close") {
    conversation.status = "closed";
  } else if (action === "reopen") {
    conversation.status = "open";
  } else if (action === "takeover") {
    conversation.adminId = new mongoose.Types.ObjectId(session.userId);
    conversation.humanTakeover = true;
    conversation.status = "open";
  }

  await conversation.save();

  await AuditLog.create({
    actorEmail: (admin as any)?.email || "",
    actorRole: (admin as any)?.role || session.role,
    action: `conversation.${action}`,
    entityType: "Conversation",
    entityId: String(conversation._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ conversation });
}
