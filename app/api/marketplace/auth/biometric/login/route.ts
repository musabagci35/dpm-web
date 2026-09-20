import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked } from "@/lib/sellerModeration";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "Biometric sign-in isn't available. Sign in with your password or phone instead.";

/**
 * Exchanges the device-bound credential (already unlocked by Face
 * ID/Touch ID on-device — this route never sees the biometric scan itself,
 * only the credential the OS released after a successful local unlock) for
 * a normal seller session, identical in shape to a password login.
 *
 * A credential mismatch — as opposed to a wrong password — is inherently
 * suspicious: this value is a random 32-byte secret, never guessable and
 * never typed by a human, so a mismatch means the stored value is wrong,
 * stale, or someone is attempting to forge one. Either way the enrollment
 * is revoked immediately rather than just rejecting the attempt.
 */
export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`seller-biometric-login-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const sellerId = String(body?.sellerId || "");
  const credential = String(body?.credential || "");

  if (!sellerId || !credential || !mongoose.Types.ObjectId.isValid(sellerId)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const seller = await MarketplaceSeller.findById(sellerId);
  if (!seller || isSellerBlocked(seller.status) || !seller.biometricCredentialHash) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const credentialHash = hashToken(credential);
  if (!safeCompareHash(seller.biometricCredentialHash, credentialHash)) {
    seller.biometricCredentialHash = null;
    await seller.save();
    await AuditLog.create({
      actorEmail: seller.email,
      actorRole: "seller",
      action: "seller.biometric_credential_mismatch_revoked",
      entityType: "MarketplaceSeller",
      entityId: String(seller._id),
      ip,
      userAgent: req.headers.get("user-agent") || "",
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
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
    action: "seller.biometric_login",
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
