import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
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
  const limited = rateLimit(`seller-reset-sms-ip:${ip}`, 10, 15 * 60 * 1000);
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

  const seller = await MarketplaceSeller.findOne({ email });

  if (!seller || !seller.otpHash || !seller.otpExpiresAt) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  if (seller.otpExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  if (seller.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Request a new code." },
      { status: 429 }
    );
  }

  const codeHash = hashToken(code);
  if (!safeCompareHash(seller.otpHash, codeHash)) {
    seller.otpAttempts += 1;
    await seller.save();
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  seller.passwordHash = await bcrypt.hash(password, 10);
  seller.otpHash = null;
  seller.otpExpiresAt = null;
  seller.otpAttempts = 0;
  seller.sessionVersion = (seller.sessionVersion || 0) + 1;
  seller.biometricCredentialHash = null;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.password_reset_sms_completed",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
