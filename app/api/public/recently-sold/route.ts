import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { PUBLIC_CAR_FIELDS, toPublicVehicle } from "@/lib/publicVehicle";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const requested = Number(searchParams.get("limit"));
    const limit =
      Number.isFinite(requested) && requested > 0
        ? Math.min(requested, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const cars = await Car.find({ status: "sold" })
      .select(PUBLIC_CAR_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    // `status` is part of the payload so clients can tell a sold record apart
    // without inferring it from which endpoint they happened to call. The sale
    // price is dropped: it was never published before and what a vehicle
    // actually sold for is the dealer's business, not a public field.
    const vehicles = cars.map((car: any) => {
      const { price, ...vehicle } = toPublicVehicle(car);
      return { ...vehicle, soldAt: vehicle.updatedAt };
    });

    return NextResponse.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    console.error("PUBLIC RECENTLY SOLD ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
