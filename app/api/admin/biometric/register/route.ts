import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { getAdminSession } from "@/lib/adminSession";
import { generateResetToken } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Same pattern as the seller biometric enrollment route — see that file for the full rationale. */
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token: credential, tokenHash } = generateResetToken();
  user.biometricCredentialHash = tokenHash;
  await user.save();

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.biometric_enrolled",
    entityType: "User",
    entityId: String(user._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ credential, userId: String(user._id) });
}
