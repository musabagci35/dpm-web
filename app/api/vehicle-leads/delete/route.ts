import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    await VehicleLead.findByIdAndUpdate(leadId, {
      status: "deleted",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vehicle lead error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}