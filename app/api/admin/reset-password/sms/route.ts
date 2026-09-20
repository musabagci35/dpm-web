import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash, OTP_MAX_ATTEMPTS } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "That code is invalid or has expired.";

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`admin-reset-sms-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const code = String(body?.code || "").trim();
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword ?? password);

  if (!email || !code || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
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

  const user = await User.findOne({ email });

  if (!user || !user.otpHash || !user.otpExpiresAt) {
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

  user.passwordHash = await bcrypt.hash(password, 10);
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpAttempts = 0;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.biometricCredentialHash = null;
  await user.save();

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.password_reset_sms_completed",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
