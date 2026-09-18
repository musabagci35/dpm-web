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

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const seller = await MarketplaceSeller.findOne({ email });
  if (!seller) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, seller.passwordHash);
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Server is not configured for authentication." },
      { status: 500 }
    );
  }

  const token = jwt.sign({ sellerId: seller._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const res = NextResponse.json({ success: true });

  res.cookies.set("seller-token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
