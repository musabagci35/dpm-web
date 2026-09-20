import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { getSellerSession } from "@/lib/sellerSession";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Lets a signed-in seller turn off biometric sign-in on their account (doesn't affect the password session itself). */
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

  seller.biometricCredentialHash = null;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.biometric_revoked",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
