import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { vin } = await req.json();

    if (!vin || vin.length < 10) {
      return NextResponse.json(
        { error: "Invalid VIN" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error("VIN API request failed");
    }

    const data = await res.json();
    const vehicle = data.Results?.[0] || {};

    return NextResponse.json({
      make: vehicle.Make || "",
      model: vehicle.Model || "",
      year: vehicle.ModelYear || "",
      engine: vehicle.EngineModel || "",
      fuel: vehicle.FuelTypePrimary || "",
      body: vehicle.BodyClass || ""
    });

  } catch (error) {
    return NextResponse.json(
      { error: "VIN decode failed" },
      { status: 500 }
    );
  }
}