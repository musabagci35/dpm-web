import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/authTokens";
import { sendMail } from "@/lib/mail";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function genericResponse() {
  return NextResponse.json({
    message: "If an account exists for that email, a password reset link has been sent.",
  });
}

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();

  const ipLimit = rateLimit(`admin-forgot-ip:${ip}`, 5, 15 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`admin-forgot-email:${email}`, 3, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) return genericResponse();

  if (!email) return genericResponse();

  const user = await User.findOne({ email });
  if (user && user.status !== "deactivated") {
    const { token, tokenHash } = generateResetToken();
    user.resetTokenHash = tokenHash;
    user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    user.resetTokenUsed = false;
    await user.save();

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.driveprimemotorsllc.com";
    const link = `${base}/admin/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: "Reset your Drive Prime Motors admin password",
      html: `
        <h2>Reset your admin password</h2>
        <p>Click the link below to choose a new password. This link expires in 30 minutes and can only be used once.</p>
        <p><a href="${link}">Reset password</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `,
    }).catch(() => {});

    await AuditLog.create({
      actorEmail: email,
      actorRole: user.role,
      action: "admin.password_reset_requested",
      entityType: "User",
      entityId: String(user._id),
      ip,
      userAgent: req.headers.get("user-agent") || "",
    });
  }

  return genericResponse();
}
