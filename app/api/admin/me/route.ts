import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  await connectDB();

  const token = req.headers.get("cookie")?.split("admin-token=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(token).select("-passwordHash");

  return NextResponse.json(user);
}