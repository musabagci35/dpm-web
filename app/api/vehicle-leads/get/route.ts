import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const leads = await VehicleLead.find().sort({ createdAt: -1 });
  return NextResponse.json(leads);
}