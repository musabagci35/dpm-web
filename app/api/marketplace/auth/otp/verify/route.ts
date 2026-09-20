import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked, GENERIC_ACCOUNT_STATUS_MESSAGE } from "@/lib/sellerModeration";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash, OTP_MAX_ATTEMPTS } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "That code is invalid or has expired.";

/** Verifies a phone-login OTP and, on success, issues a normal seller session — same cookie/shape as password login. */
export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`seller-otp-login-verify-ip:${ip}`, 10, 15 * 60 * 1000);
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

  const seller = await MarketplaceSeller.findOne({ phone, phoneVerified: true });
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

  seller.otpHash = null;
  seller.otpExpiresAt = null;
  seller.otpAttempts = 0;
  await seller.save();

  // The code itself has now been proven correct — safe to be honest about
  // a restricted account here (see login/route.ts for the full rationale).
  if (isSellerBlocked(seller.status)) {
    return NextResponse.json({ error: GENERIC_ACCOUNT_STATUS_MESSAGE }, { status: 403 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is not configured for authentication." },
      { status: 500 }
    );
  }

  const token = jwt.sign(
    { sellerId: seller._id, sessionVersion: seller.sessionVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.otp_login_completed",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("seller-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
