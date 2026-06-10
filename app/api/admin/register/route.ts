import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  await connectDB();

  const { email, password, role, name } = await req.json();

  const passwordHash = await bcrypt.hash(password, 10);

  await User.create({
    email,
    passwordHash,
    role: role || "admin",
    name,
  });

  return NextResponse.json({ success: true });
}