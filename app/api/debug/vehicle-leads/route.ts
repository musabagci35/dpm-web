import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

export async function GET() {
  await connectDB();

  const count = await VehicleLead.countDocuments();
  const leads = await VehicleLead.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json({
    success: true,
    count,
    leads,
  });
}
