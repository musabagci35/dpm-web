import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    const images = body.images || [];

    if (!id || !Array.isArray(images)) {
      return NextResponse.json(
        { success: false, error: "Missing id or images" },
        { status: 400 }
      );
    }

    await connectDB();

    await AuctionVehicle.findByIdAndUpdate(id, {
      $push: {
        images: {
          $each: images,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Image save failed" },
      { status: 500 }
    );
  }
}
