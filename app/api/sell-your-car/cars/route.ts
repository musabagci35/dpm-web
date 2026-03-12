import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await connectDB();

    const car = await Car.create({
      year: body.year,
      make: body.make,
      model: body.model,
      price: body.price,
      mileage: body.mileage,
    });

    return NextResponse.json({ success: true, car });
  } catch (error) {
    console.error("ADD CAR ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
