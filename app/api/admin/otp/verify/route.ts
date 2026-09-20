import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash, OTP_MAX_ATTEMPTS } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "That code is invalid or has expired.";

/** Verifies an admin phone-login OTP and, on success, issues a normal admin session. */
export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`admin-otp-login-verify-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone || "").trim();
  const code = String(body?.code || "").trim();

  if (!phone || !code) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const user = await User.findOne({ phone, phoneVerified: true });
  if (!user || user.status === "deactivated" || !user.otpHash || !user.otpExpiresAt) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Request a new code." },
      { status: 429 }
    );
  }

  const codeHash = hashToken(code);
  if (!safeCompareHash(user.otpHash, codeHash)) {
    user.otpAttempts += 1;
    await user.save();
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  await user.save();

  const token = jwt.sign(
    { userId: user._id, role: user.role, sessionVersion: user.sessionVersion || 0 },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.otp_login_completed",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
