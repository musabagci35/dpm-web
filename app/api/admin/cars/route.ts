import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();

    // burada create işlemi
    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}