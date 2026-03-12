import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {

  const { query } = await req.json();

  await connectDB();

  const text = query.toLowerCase();

  const filter: any = {};

  // PRICE
  const priceMatch = text.match(/(\d+)[kK]/);
  if (priceMatch) {
    filter.price = { $lte: Number(priceMatch[1]) * 1000 };
  }

  // YEAR
  const yearMatch = text.match(/20\d{2}/);
  if (yearMatch) {
    filter.year = { $gte: Number(yearMatch[0]) };
  }

  // MAKE
  const makes = ["toyota","honda","bmw","ford","chevy","nissan","lexus"];

  for (const make of makes) {
    if (text.includes(make)) {
      filter.make = new RegExp(make, "i");
    }
  }

  const cars = await Car.find(filter)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({ cars });

}