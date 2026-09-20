import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked } from "@/lib/sellerModeration";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { generateOtp, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS } from "@/lib/authTokens";
import { isSmsConfigured, smsNotConfiguredResponse } from "@/lib/smsOtp";
import { sendSMS } from "@/lib/sms";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function genericResponse() {
  return NextResponse.json({
    message: "If that phone number has a verified account, a login code was sent.",
  });
}

/** Requests a login OTP for the seller with this verified phone number. */
export async function POST(req: Request) {
  await connectDB();

  if (!isSmsConfigured()) {
    return NextResponse.json(smsNotConfiguredResponse(), { status: 503 });
  }

  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone || "").trim();

  const ipLimit = rateLimit(`seller-otp-login-ip:${ip}`, 8, 15 * 60 * 1000);
  const phoneLimit = phone
    ? rateLimit(`seller-otp-login-phone:${phone}`, 5, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !phoneLimit.success) return genericResponse();

  if (!phone) return genericResponse();

  const seller = await MarketplaceSeller.findOne({ phone, phoneVerified: true });
  if (!seller || isSellerBlocked(seller.status)) return genericResponse();

  if (seller.otpLastSentAt && Date.now() - seller.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return genericResponse();
  }

  const { code, codeHash } = generateOtp();
  seller.otpHash = codeHash;
  seller.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  seller.otpAttempts = 0;
  seller.otpLastSentAt = new Date();
  await seller.save();

  await sendSMS(phone, `Your Drive Prime Motors login code is ${code}. It expires in 10 minutes.`).catch(() => {});

  await AuditLog.create({
    actorRole: "seller",
    action: "seller.otp_login_requested",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return genericResponse();
}
