import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {
  await connectDB();

  const { vin } = await req.json();

  if (!vin) {
    return NextResponse.json(
      { error: "VIN is required" },
      { status: 400 }
    );
  }

  try {
    // 🔥 NHTSA API
    const apiRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
    );

    const data = await apiRes.json();

    const results = data.Results;

    // helper
    const get = (key: string) =>
      results.find((r: any) => r.Variable === key)?.Value || "";

    const make = get("Make");
    const model = get("Model");
    const year = get("Model Year");
    const body = get("Body Class");
    const engine = get("Engine Model");

    // 🔥 DB create
    const car = await Car.create({
      vin,
      title: `${year} ${make} ${model}`,
      year: Number(year) || 0,
      price: 0,
      mileage: 0,
      image: "",
      make,
      model,
      body,
      engine,
    });

    return NextResponse.json({
      carId: car._id,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "VIN decode failed" },
      { status: 500 }
    );
  }
}