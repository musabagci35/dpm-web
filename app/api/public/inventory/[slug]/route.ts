import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import {
  isPubliclyVisible,
  PUBLIC_CAR_FIELDS,
  toPublicVehicle,
  withDecodedSpecs,
} from "@/lib/publicVehicle";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    // Older records were created before slugs were generated, so a listing is
    // also reachable by its id — that is what the mobile app falls back to.
    const query = /^[0-9a-f]{24}$/i.test(slug)
      ? { $or: [{ slug }, { _id: slug }] }
      : { slug };

    const car: any = await Car.findOne(query).select(PUBLIC_CAR_FIELDS).lean();

    if (!car || !isPubliclyVisible(car)) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    // A single vehicle is worth a live decode on a cache miss: it fills in
    // specs the dealer left blank and is cached for every later request.
    const vehicle = await withDecodedSpecs(
      toPublicVehicle(car),
      String(car.vin || ""),
      "live"
    );

    return NextResponse.json({ success: true, vehicle });
  } catch (error) {
    console.error("PUBLIC VEHICLE DETAIL ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
