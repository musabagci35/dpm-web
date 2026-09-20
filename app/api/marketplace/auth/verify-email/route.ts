import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { hashToken, safeCompareHash } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const token = String(body?.token || "");
  if (!token) {
    return NextResponse.json({ error: "This verification link is invalid." }, { status: 400 });
  }

  const tokenHash = hashToken(token);
  const seller = await MarketplaceSeller.findOne({ emailVerifyTokenHash: tokenHash });

  const invalid =
    !seller ||
    !seller.emailVerifyTokenExpiresAt ||
    seller.emailVerifyTokenExpiresAt.getTime() < Date.now() ||
    !safeCompareHash(seller.emailVerifyTokenHash, tokenHash);

  if (invalid) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  seller.emailVerified = true;
  seller.emailVerifyTokenHash = null;
  seller.emailVerifyTokenExpiresAt = null;
  await seller.save();

  await AuditLog.create({
    actorEmail: seller.email,
    actorRole: "seller",
    action: "seller.email_verified",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ success: true });
}
