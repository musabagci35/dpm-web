import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const vin = searchParams.get("vin")?.trim();

    if (!vin) {
      return NextResponse.json(
        { error: "VIN required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { cache: "no-store" }
    );

    const data = await res.json();
    const vehicle = data?.Results?.[0];

    if (!vehicle) {
      return NextResponse.json(
        { error: "VIN decode failed" },
        { status: 400 }
      );
    }

    const report = {
      vin,
      make: vehicle.Make || "",
      model: vehicle.Model || "",
      year: vehicle.ModelYear || "",
      trim: vehicle.Trim || "",
      engine: vehicle.DisplacementL
        ? `${vehicle.DisplacementL}L ${vehicle.EngineConfiguration || ""}`.trim()
        : vehicle.EngineModel || "",
      fuel: vehicle.FuelTypePrimary || "",
      body: vehicle.BodyClass || "",
      driveType: vehicle.DriveType || "",
      transmission: vehicle.TransmissionStyle || "",
      manufacturer: vehicle.Manufacturer || "",
      plantCountry: vehicle.PlantCountry || "",
      plantCompany: vehicle.PlantCompanyName || "",
      doors: vehicle.Doors || "",
      series: vehicle.Series || "",
      vehicleType: vehicle.VehicleType || "",
      suggestedLinks: {
        bidfax: `https://bidfax.info/search?q=${encodeURIComponent(vin)}`,
        statvin: `https://stat.vin/cars/${encodeURIComponent(vin)}`,
        poctra: `https://poctra.com/search?query=${encodeURIComponent(vin)}`,
        copart: `https://www.copart.com/lotSearchResults?free=true&query=${encodeURIComponent(vin)}`,
        iaai: `https://www.iaai.com/Search?SearchVehicleKeyword=${encodeURIComponent(vin)}`,
      },
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("vin-report error:", error);
    return NextResponse.json(
      { error: "Failed to build VIN report" },
      { status: 500 }
    );
  }
}