import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { vin } = await req.json();

  if (!vin || typeof vin !== "string") {
    return NextResponse.json({ error: "VIN required" }, { status: 400 });
  }

  const cleanVin = vin.trim().toUpperCase();

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "VIN decode failed" }, { status: 502 });
  }

  const data = await res.json();
  const results = data?.Results || [];

  const pick = (variable: string) =>
    results.find((r: any) => r.Variable === variable)?.Value || "";

  const decoded = {
    vin: cleanVin,
    year: pick("Model Year"),
    make: pick("Make"),
    model: pick("Model"),
    trim: pick("Trim"),
    bodyStyle: pick("Body Class"),
    fuelType: pick("Fuel Type - Primary"),
    transmission: pick("Transmission Style"),
    drivetrain: pick("Drive Type"),
    engineModel: pick("Engine Model"),
    engineCylinders: pick("Engine Number of Cylinders"),
    displacementL: pick("Displacement (L)"),
  };

  return NextResponse.json(decoded);
}