import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import AuditLog from "@/models/AuditLog";
import { rateLimit } from "@/lib/rateLimit";
import { generateResetToken, EMAIL_VERIFY_TTL_MS } from "@/lib/authTokens";
import { sendMail } from "@/lib/mail";
import { isDisposableEmail } from "@/lib/disposableEmail";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function sendVerificationEmail(email: string, token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.driveprimemotorsllc.com";
  const link = `${base}/sell/verify-email?token=${token}`;
  await sendMail({
    to: email,
    subject: "Verify your Drive Prime Motors seller account",
    html: `
      <h2>Verify your email</h2>
      <p>Confirm this email address to finish setting up your seller account.</p>
      <p><a href="${link}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    `,
  });
}

export async function POST(req: Request) {
  await connectDB();

  const ip = clientIp(req);
  const limited = rateLimit(`seller-register:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword ?? password);
  const name = String(body?.name || "").trim();
  const phone = String(body?.phone || "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: "Please use a permanent email address, not a disposable/temporary one." },
      { status: 400 }
    );
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

  const existing = await MarketplaceSeller.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "An account already exists with that email. Try signing in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { token, tokenHash } = generateResetToken();

  const seller = await MarketplaceSeller.create({
    email,
    passwordHash,
    name,
    phone,
    emailVerified: false,
    emailVerifyTokenHash: tokenHash,
    emailVerifyTokenExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
  });

  await sendVerificationEmail(email, token).catch(() => {
    // Account creation still succeeds — the seller can request the
    // verification email again rather than losing the account entirely.
  });

  await AuditLog.create({
    actorEmail: email,
    actorRole: "seller",
    action: "seller.register",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent: req.headers.get("user-agent") || "",
  });

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is not configured for authentication." },
      { status: 500 }
    );
  }

  const jwtToken = jwt.sign(
    { sellerId: seller._id, sessionVersion: seller.sessionVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  const res = NextResponse.json({ success: true }, { status: 201 });

  res.cookies.set("seller-token", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
