import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  await connectDB();

  let email = "";
  let password = "";

  // 🔥 SAFE JSON PARSE
  try {
    const body = await req.json();
    email = body?.email || "";
    password = body?.password || "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 401 }
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return NextResponse.json(
      { error: "Wrong password" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  const res = NextResponse.json({ success: true });

  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: false, // 🔥 localhost için kesin böyle
    sameSite: "lax",
    path: "/",
  });

  return res;
}