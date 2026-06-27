import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { vin } = await req.json();

    if (!vin || vin.length < 11) {
      return NextResponse.json(
        { error: "Valid VIN is required" },
        { status: 400 }
      );
    }

    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`;

    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    const item = data.Results?.[0];

    return NextResponse.json({
      vin,
      year: Number(item.ModelYear) || null,
      make: item.Make || "",
      model: item.Model || "",
      trim: item.Trim || "",
      bodyClass: item.BodyClass || "",
      engine: item.EngineModel || item.DisplacementL ? `${item.DisplacementL}L` : "",
      transmission: item.TransmissionStyle || "",
      fuelType: item.FuelTypePrimary || "",
      drivetrain: item.DriveType || "",
      doors: item.Doors || "",
      plantCountry: item.PlantCountry || "",
      raw: item,
    });
  } catch (err) {
    console.error("VIN decode error:", err);
    return NextResponse.json(
      { error: "VIN decode failed" },
      { status: 500 }
    );
  }
}