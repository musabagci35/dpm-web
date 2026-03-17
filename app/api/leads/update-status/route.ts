import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function POST(req: Request) {

  await connectDB();

  const { leadId, status } = await req.json();

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    { status },
    { new: true }
  );

  return NextResponse.json({
    success: true,
    lead,
  });
}