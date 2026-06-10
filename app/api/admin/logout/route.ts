import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set("admin-token", "", {
    expires: new Date(0),
    path: "/", // 🔥 önemli
  });

  return res;
}