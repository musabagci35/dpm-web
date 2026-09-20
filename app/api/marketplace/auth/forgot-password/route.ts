import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked } from "@/lib/sellerModeration";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/authTokens";
import { sendMail } from "@/lib/mail";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// Always the same body/status regardless of what actually happened — an
// attacker probing emails must not be able to tell a real account from a
// nonexistent one by response content, status code, or timing shape. A
// fresh Response is built each call — a single shared instance can't be
// reused as a live HTTP response across concurrent invocations.
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

  const ipLimit = rateLimit(`seller-forgot-ip:${ip}`, 5, 15 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`seller-forgot-email:${email}`, 3, 15 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) {
    // Still generic — a 429 with a distinct body would itself leak whether
    // the email is being actively targeted.
    return genericResponse();
  }

  if (!email) return genericResponse();

  const seller = await MarketplaceSeller.findOne({ email });
  if (seller && !isSellerBlocked(seller.status)) {
    const { token, tokenHash } = generateResetToken();
    seller.resetTokenHash = tokenHash;
    seller.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    seller.resetTokenUsed = false;
    await seller.save();

    const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.driveprimemotorsllc.com";
    const link = `${base}/sell/reset-password?token=${token}`;

    await sendMail({
      to: email,
      subject: "Reset your Drive Prime Motors seller password",
      html: `
        <h2>Reset your password</h2>
        <p>Click the link below to choose a new password. This link expires in 30 minutes and can only be used once.</p>
        <p><a href="${link}">Reset password</a></p>
        <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
      `,
    }).catch(() => {});

    await AuditLog.create({
      actorEmail: email,
      actorRole: "seller",
      action: "seller.password_reset_requested",
      entityType: "MarketplaceSeller",
      entityId: String(seller._id),
      ip,
      userAgent: req.headers.get("user-agent") || "",
    });
  }

  return genericResponse();
}
