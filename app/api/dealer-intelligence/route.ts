import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {

  const { vin, price } = await req.json();

  await connectDB();

  const car = await Car.findOne({ vin });

  if (!car) {
    return NextResponse.json({ error: "Vehicle not found" });
  }

  const auctionValue = price * 0.55;
  const retailValue = price * 1.15;
  const dealerProfit = retailValue - auctionValue;

  return NextResponse.json({

    vin,
    make: car.make,
    model: car.model,
    year: car.year,

    auctionValue,
    retailValue,
    dealerProfit,

    daysToSell: 14

  });

}