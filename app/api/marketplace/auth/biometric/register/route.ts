import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { getSellerSession } from "@/lib/sellerSession";
import { generateResetToken } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Issues a new device-bound biometric credential for the *already signed-in*
 * seller — this is never reachable as a first login method, only as an
 * opt-in step after a real email/password or phone/OTP session exists.
 * The raw credential is returned exactly once and never stored server-side;
 * only its hash is kept, mirroring how a password itself is handled.
 */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  await connectDB();
  const seller = await MarketplaceSeller.findById(session.sellerId);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token: credential, tokenHash } = generateResetToken();
  seller.biometricCredentialHash = tokenHash;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.biometric_enrolled",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ credential, sellerId: String(seller._id) });
}
