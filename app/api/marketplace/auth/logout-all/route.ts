import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { getSellerSession } from "@/lib/sellerSession";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Revokes every session on every device — including this one — by bumping sessionVersion, and clears any biometric unlock credential. */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const seller = await MarketplaceSeller.findById(session.sellerId);
  if (!seller) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  seller.sessionVersion = (seller.sessionVersion || 0) + 1;
  seller.biometricCredentialHash = null;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.logout_all",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("seller-token", "", { expires: new Date(0), path: "/" });
  return res;
}
