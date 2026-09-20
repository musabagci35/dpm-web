import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked, GENERIC_ACCOUNT_STATUS_MESSAGE } from "@/lib/sellerModeration";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  // Rate-limited per IP and per email, so an attacker can't dodge the IP
  // limit by spreading attempts, nor lock a legitimate user out purely by
  // hammering someone else's IP.
  const ipLimit = rateLimit(`seller-login-ip:${ip}`, 10, 10 * 60 * 1000);
  const emailLimit = email
    ? rateLimit(`seller-login-email:${email}`, 8, 10 * 60 * 1000)
    : { success: true };
  if (!ipLimit.success || !emailLimit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!email || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const seller = await MarketplaceSeller.findOne({ email });
  const isMatch = seller ? await bcrypt.compare(password, seller.passwordHash) : false;

  if (!seller || !isMatch) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (isSellerBlocked(seller.status)) {
    // Safe to be more specific here than the "wrong password" branch above:
    // the password has already been confirmed correct, so this can never
    // help an attacker who doesn't already have it — but it's honest and
    // useful to the real accountholder, who deserves to know it's not a
    // typo. The specific status (frozen vs. suspended) and the internal
    // reason are still never exposed.
    return NextResponse.json({ error: GENERIC_ACCOUNT_STATUS_MESSAGE }, { status: 403 });
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
    actorEmail: email,
    actorRole: "seller",
    action: "seller.login",
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
