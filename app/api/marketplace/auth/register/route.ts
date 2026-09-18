import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();
  const phone = String(body?.phone || "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await MarketplaceSeller.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "An account already exists with that email. Try signing in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const seller = await MarketplaceSeller.create({
    email,
    passwordHash,
    name,
    phone,
  });

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is not configured for authentication." },
      { status: 500 }
    );
  }

  const token = jwt.sign({ sellerId: seller._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const res = NextResponse.json({ success: true }, { status: 201 });

  res.cookies.set("seller-token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
