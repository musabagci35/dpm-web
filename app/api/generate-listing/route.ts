import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Dealer from "@/models/Dealer";
import mongoose from "mongoose";

export async function POST(req: Request) {

  try {

    const { vin, price = 0 } = await req.json();

    if (!vin) {
      return NextResponse.json(
        { error: "VIN required" },
        { status: 400 }
      );
    }

    await connectDB();

    /* dealer */

    const dealer = await Dealer.findOne().sort({ createdAt: 1 });
console.log("Connected DB:", mongoose.connection.name);
    if (!dealer) {
      return NextResponse.json(
        { error: "Dealer not found" },
        { status: 400 }
      );
    }

    /* duplicate check */

    const existing = await Car.findOne({
      vin,
      dealerId: dealer._id
    });

    if (existing) {
      return NextResponse.json({
        error: "Vehicle already exists"
      });
    }

    /* decode VIN */

    const vinRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    );

    const vinData = await vinRes.json();
    const vehicle = vinData.Results?.[0];

    if (!vehicle) {
      return NextResponse.json(
        { error: "VIN decode failed" },
        { status: 400 }
      );
    }

    const make = vehicle.Make || "Unknown";
    const model = vehicle.Model || "Unknown";
    const year = Number(vehicle.ModelYear) || 0;

    /* photo */

    const photo = `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${model}&modelYear=${year}&zoomType=fullscreen&angle=front`;

    /* description */

    const description = `
${year} ${make} ${model}

Clean and reliable vehicle ready for daily driving.

Features
• Fuel efficient
• Smooth engine
• Clean interior

Drive Prime Motors
Rancho Cordova CA
`;

    /* create car */

    const newCar = await Car.create({

      vin,
      make,
      model,
      year,

      price: Number(price),

      dealerId: dealer._id,

      description,

      images: [
        {
          url: photo
        }
      ],

      isActive: false

    });

    return NextResponse.json(newCar);

  } catch (error) {

    console.error("generate-listing error:", error);

    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );

  }

}

const generateListings = async () => {
  try {
    console.log("CLICK GENERATE");

    const res = await fetch("/api/listing-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ car }),
    });

    console.log("RES STATUS:", res.status);

    const data = await res.json();

    console.log("AI DATA:", data);

    setListings({
      facebook: data.facebook || "",
      craigslist: data.craigslist || "",
      offerup: data.offerup || "",
    });
  } catch (err) {
    console.error("GEN ERROR:", err);
    alert("Generate failed");
  }
};

