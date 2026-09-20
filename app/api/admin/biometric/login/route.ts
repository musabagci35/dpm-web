import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { hashToken, safeCompareHash } from "@/lib/authTokens";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "Biometric sign-in isn't available. Sign in with your password or phone instead.";

/** Same pattern as the seller biometric login route, including immediate revocation on a credential mismatch — see that file for the full rationale. */
export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`admin-biometric-login-ip:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || "");
  const credential = String(body?.credential || "");

  if (!userId || !credential || !mongoose.Types.ObjectId.isValid(userId)) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user || user.status === "deactivated" || !user.biometricCredentialHash) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const credentialHash = hashToken(credential);
  if (!safeCompareHash(user.biometricCredentialHash, credentialHash)) {
    user.biometricCredentialHash = null;
    await user.save();
    await AuditLog.create({
      actorEmail: user.email,
      actorRole: user.role,
      action: "admin.biometric_credential_mismatch_revoked",
      entityType: "User",
      entityId: String(user._id),
      ip,
      userAgent: req.headers.get("user-agent") || "",
    });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role, sessionVersion: user.sessionVersion || 0 },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  await AuditLog.create({
    actorEmail: user.email,
    actorRole: user.role,
    action: "admin.biometric_login",
    entityType: "User",
    entityId: String(user._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res;
}
