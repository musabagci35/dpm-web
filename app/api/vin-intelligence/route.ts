import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

const DEALER_ID = "69ab61daaef42746175b0a9b"; // Drive Prime Motors

export async function POST(req: Request) {
  try {
    await connectDB();

    const { vin } = await req.json();

    if (!vin) {
      return NextResponse.json({ error: "VIN required" }, { status: 400 });
    }

    // ---------- NHTSA VIN Decode
    const decodeRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
    );

    const decodeData = await decodeRes.json();

    const results = decodeData?.Results || [];

    const findValue = (name: string) =>
      results.find((r: any) => r.Variable === name)?.Value || "";

    const make = findValue("Make") || "Unknown";
    const model = findValue("Model") || "Unknown";
    const year = Number(findValue("Model Year")) || 2000;

    // ---------- Create Car
    const car = await Car.create({
      title: `${year} ${make} ${model}`,

      year,
      make,
      model,

      price: 0, // zorunlu olduğu için default

      mileage: 0,

      vin: vin.toUpperCase(),

      dealerId: new mongoose.Types.ObjectId(DEALER_ID),

      isActive: true,
    });

    return NextResponse.json({
      success: true,
      car,
    });

  } catch (error) {
    console.error("IMPORT VIN ERROR:", error);

    return NextResponse.json(
      { error: "Failed to import VIN" },
      { status: 500 }
    );
  }
}