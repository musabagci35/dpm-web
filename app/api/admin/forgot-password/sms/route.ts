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

  const ipLimit = rateLimit(`admin-forgot-sms-ip:${ip}`, 5, 15 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`admin-forgot-sms-email:${email}`, 3, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) return genericResponse();

  if (!email) return genericResponse();

  const user = await User.findOne({ email });
  if (!user || user.status === "deactivated" || !user.phoneVerified || !user.phone) {
    return genericResponse();
  }

  if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return genericResponse(maskPhone(user.phone));
  }

  const { code, codeHash } = generateOtp();
  user.otpHash = codeHash;
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();

  await sendSMS(user.phone, `Your Drive Prime Motors admin verification code is ${code}. It expires in 10 minutes.`).catch(
    () => {}
  );

  await AuditLog.create({
    actorEmail: email,
    actorRole: user.role,
    action: "admin.password_reset_sms_requested",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return genericResponse(maskPhone(user.phone));
}
