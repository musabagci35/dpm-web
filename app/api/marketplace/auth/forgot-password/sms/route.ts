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

/** Same phone shown everywhere a masked number is surfaced to the user. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••-•••-${digits.slice(-4)}`;
}

function genericResponse(maskedPhone?: string) {
  return NextResponse.json({
    message: maskedPhone
      ? `If that account has a verified phone number, a code was sent to ${maskedPhone}.`
      : "If an account exists for that email with a verified phone number, a code has been sent.",
  });
}

export async function POST(req: Request) {
  await connectDB();

  if (!isSmsConfigured()) {
    return NextResponse.json(smsNotConfiguredResponse(), { status: 503 });
  }

  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();

  const ipLimit = rateLimit(`seller-forgot-sms-ip:${ip}`, 5, 15 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`seller-forgot-sms-email:${email}`, 3, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) return genericResponse();

  if (!email) return genericResponse();

  const seller = await MarketplaceSeller.findOne({ email });
  if (!seller || isSellerBlocked(seller.status) || !seller.phoneVerified || !seller.phone) {
    return genericResponse();
  }

  if (seller.otpLastSentAt && Date.now() - seller.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return genericResponse(maskPhone(seller.phone));
  }

  const { code, codeHash } = generateOtp();
  seller.otpHash = codeHash;
  seller.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  seller.otpAttempts = 0;
  seller.otpLastSentAt = new Date();
  await seller.save();

  // Never logged — only handed to the SMS provider, which is the one place
  // it has to exist in plaintext to reach the user.
  await sendSMS(seller.phone, `Your Drive Prime Motors verification code is ${code}. It expires in 10 minutes.`).catch(
    () => {}
  );

  await AuditLog.create({
    actorEmail: email,
    actorRole: "seller",
    action: "seller.password_reset_sms_requested",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return genericResponse(maskPhone(seller.phone));
}
