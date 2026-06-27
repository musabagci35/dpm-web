import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, images } = body;

    if (!id || !Array.isArray(images)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await connectDB();

    await AuctionVehicle.findByIdAndUpdate(id, {
      images,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
