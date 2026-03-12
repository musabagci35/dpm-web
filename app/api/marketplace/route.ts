import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    await connectDB();

    const car = await Car.create({
      year: data.year,
      make: data.make,
      model: data.model,
      mileage: data.mileage,
      price: 0,
      image: "/car.png",
      source: "marketplace"
    });

    return NextResponse.json({ success: true, car });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}