import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`admin-reset-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword ?? password);

  if (!token || !password) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({ resetTokenHash: tokenHash });

  const invalid =
    !user ||
    user.resetTokenUsed ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt.getTime() < Date.now() ||
    !safeCompareHash(user.resetTokenHash, tokenHash);

  if (invalid) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenUsed = true;
  user.resetTokenHash = null;
  user.resetTokenExpiresAt = null;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.biometricCredentialHash = null;
  await user.save();

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.password_reset_completed",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
