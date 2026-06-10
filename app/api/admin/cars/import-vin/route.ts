import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import VinHistory from "@/models/VinHistory";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { vin, dealerId } = await req.json();

    const cleanVin = String(vin || "").trim().toUpperCase();

    if (!cleanVin) {
      return NextResponse.json(
        { error: "VIN required" },
        { status: 400 }
      );
    }

    if (cleanVin.length !== 17) {
      return NextResponse.json(
        { error: "VIN must be 17 characters" },
        { status: 400 }
      );
    }

    if (!dealerId) {
      return NextResponse.json(
        { error: "Dealer ID required" },
        { status: 400 }
      );
    }

    const existing = await Car.findOne({
      vin: cleanVin,
      dealerId,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        carId: existing._id,
        existing: true,
      });
    }

    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${cleanVin}?format=json`;

    const nhtsaRes = await fetch(nhtsaUrl, {
      cache: "no-store",
    });

    if (!nhtsaRes.ok) {
      return NextResponse.json(
        { error: "VIN decode request failed" },
        { status: 500 }
      );
    }

    const nhtsaData = await nhtsaRes.json();
    const vehicle = nhtsaData?.Results?.[0] || {};

    const make = vehicle.Make || "Unknown";
    const model = vehicle.Model || "Unknown";
    const year = Number(vehicle.ModelYear) || 2000;
    const trim = vehicle.Trim || "";

    const engine = vehicle.EngineModel || "";
    const fuel = vehicle.FuelTypePrimary || "";
    const body = vehicle.BodyClass || "";
    const manufacturer =
      vehicle.Manufacturer || vehicle.ManufacturerName || "";
    const doors = vehicle.Doors || "";

    const image = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(
      make
    )}&modelFamily=${encodeURIComponent(
      model
    )}&modelYear=${year}&zoomType=fullscreen&angle=front`;

    const safeImage = image || "/car-placeholder.jpg";

    const title = `${year} ${make} ${model}${trim ? ` ${trim}` : ""}`;

    const description = `${title}

This vehicle delivers a smooth and dependable driving experience.

Engine: ${engine || "N/A"}
Fuel: ${fuel || "N/A"}
Body Style: ${body || "N/A"}
Doors: ${doors || "N/A"}
Manufacturer: ${manufacturer || "N/A"}

A great choice for daily commuting or long-distance travel, offering comfort, reliability, and strong overall value.`;

    const car = await Car.create({
      title,
      year,
      make,
      model,
      trim,

      price: 0,
      mileage: 0,

      vin: cleanVin,
      description,

      images: [
        {
          url: safeImage,
          publicId: "",
          isCover: true,
        },
      ],

      status: "available",
      isActive: true,
      isFeatured: false,

      cost: 0,
      recon: 0,
      docFee: 0,

      marketing: {
        facebookPosted: false,
        craigslistReady: false,
        offerupReady: false,
        marketplaceReady: false,
        googleIndexed: false,
        lastMarketingRunAt: null,
      },

      dealerId: new mongoose.Types.ObjectId(dealerId),

      // extra decoded values
      engine,
      fuelType: fuel,
      bodyStyle: body,
      doors,
      manufacturer,
    });

    await VinHistory.create({
      vin: cleanVin,
      make,
      model,
      year,
    });

    return NextResponse.json({
      success: true,
      carId: car._id,
      existing: false,
    });
  } catch (err) {
    console.error("VIN IMPORT ERROR", err);

    return NextResponse.json(
      { error: "VIN import failed" },
      { status: 500 }
    );
  }
}