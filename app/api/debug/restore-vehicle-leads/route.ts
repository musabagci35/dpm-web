import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

export async function GET() {
  await connectDB();

  const result = await VehicleLead.updateMany(
    { status: "deleted" },
    { $set: { status: "new" } }
  );

  return NextResponse.json({
    success: true,
    restored: result.modifiedCount,
  });
}
