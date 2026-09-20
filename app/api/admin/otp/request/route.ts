import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
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
    message: "If that phone number has a verified admin account, a login code was sent.",
  });
}

/** Requests a login OTP for the admin with this verified phone number. */
export async function POST(req: Request) {
  await connectDB();

  if (!isSmsConfigured()) {
    return NextResponse.json(smsNotConfiguredResponse(), { status: 503 });
  }

  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone || "").trim();

  const ipLimit = rateLimit(`admin-otp-login-ip:${ip}`, 8, 15 * 60 * 1000);
  const phoneLimit = phone
    ? rateLimit(`admin-otp-login-phone:${phone}`, 5, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !phoneLimit.success) return genericResponse();

  if (!phone) return genericResponse();

  const user = await User.findOne({ phone, phoneVerified: true });
  if (!user || user.status === "deactivated") return genericResponse();

  if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return genericResponse();
  }

  const { code, codeHash } = generateOtp();
  user.otpHash = codeHash;
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  await sendSMS(phone, `Your Drive Prime Motors admin login code is ${code}. It expires in 10 minutes.`).catch(() => {});

  await AuditLog.create({
    actorRole: "admin",
    action: "admin.otp_login_requested",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return genericResponse();
}
