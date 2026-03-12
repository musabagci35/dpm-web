import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();

    await connectDB();

    await VehicleLead.findByIdAndUpdate(id, { status });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}