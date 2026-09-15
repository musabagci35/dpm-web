import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function GET() {
  try {
    await connectDB();

    const cars = await Car.find({ status: "sold" })
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("year make model trim mileage images slug")
      .lean();

    return NextResponse.json({
      success: true,
      vehicles: cars.map((car: any) => ({ ...car, _id: car._id.toString() })),
    });
  } catch (error) {
    console.error("PUBLIC RECENTLY SOLD ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
