import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`seller-reset-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword ?? password);

  if (!token || !password) {
    return NextResponse.json({ error: "This reset link is invalid." }, { status: 400 });
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

  const tokenHash = hashToken(token);
  const seller = await MarketplaceSeller.findOne({ resetTokenHash: tokenHash });

  const invalid =
    !seller ||
    seller.resetTokenUsed ||
    !seller.resetTokenExpiresAt ||
    seller.resetTokenExpiresAt.getTime() < Date.now() ||
    !safeCompareHash(seller.resetTokenHash, tokenHash);

  if (invalid) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  seller.passwordHash = await bcrypt.hash(password, 10);
  seller.resetTokenUsed = true;
  seller.resetTokenHash = null;
  seller.resetTokenExpiresAt = null;
  // Revokes every session issued before this moment, on every device —
  // the whole point of a reset is that a compromised session shouldn't
  // survive it.
  seller.sessionVersion = (seller.sessionVersion || 0) + 1;
  // A stale biometric unlock credential must not outlive the password it
  // was bound to.
  seller.biometricCredentialHash = null;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.password_reset_completed",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
