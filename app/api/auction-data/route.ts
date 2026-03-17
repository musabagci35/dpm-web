import { NextResponse } from "next/server";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");

  if (!vin) {
    return NextResponse.json({ error: "VIN required" });
  }

  const url = `https://api.marketcheck.com/v2/search/car/active?api_key=${process.env.MARKETCHECK_API}&vin=${vin}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.listings || data.listings.length === 0) {
    return NextResponse.json({ message: "No auction data found" });
  }

  const car = data.listings[0];

  return NextResponse.json({
    price: car.price,
    mileage: car.miles,
    exterior_color: car.exterior_color,
    photos: car.media?.photo_links || [],
    dealer: car.dealer?.name,
    city: car.dealer?.city
  });
}