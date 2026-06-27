import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin")?.trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    return NextResponse.json(
      { success: false, error: "Valid 17-digit VIN required" },
      { status: 400 }
    );
  }

  try {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`;

    const res = await fetch(url, {
      cache: "no-store",
    });

    const data = await res.json();
    const item = data?.Results?.[0];

    return NextResponse.json({
      success: true,
      vin,
      vehicle: {
        year: item?.ModelYear || "",
        make: item?.Make || "",
        model: item?.Model || "",
        trim: item?.Trim || item?.Series || "",
        bodyClass: item?.BodyClass || "",
        engine: item?.DisplacementL
          ? `${item.DisplacementL}L`
          : item?.EngineModel || "",
        transmission: item?.TransmissionStyle || "",
        driveType: item?.DriveType || "",
        fuelType: item?.FuelTypePrimary || "",
        doors: item?.Doors || "",
        plantCountry: item?.PlantCountry || "",
      },
      auctionSources: {
        copart: null,
        manheim: null,
        iaa: null,
      },
      message:
        "VIN decoded. Auction photos require Copart/Manheim/IAA API credentials.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "VIN decode failed" },
      { status: 500 }
    );
  }
}
