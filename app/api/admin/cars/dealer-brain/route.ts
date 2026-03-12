import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {

  await connectDB();

  const { vin } = await req.json();

  if (!vin) {
    return NextResponse.json({ error: "VIN required" }, { status: 400 });
  }

  const cleanVin = vin.trim().toUpperCase();

  /* VIN decode */
  const vinRes = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`
  );

  const vinData = await vinRes.json();

  const results = vinData.Results || [];

  const get = (name: string) =>
    results.find((r: any) => r.Variable === name)?.Value || "";

  const year = Number(get("Model Year"));
  const make = get("Make");
  const model = get("Model");
  const trim = get("Trim");

  if (!year || !make || !model) {
    return NextResponse.json({ error: "VIN decode failed" }, { status: 400 });
  }

  /* price estimate */
  const estimatedPrice = 15000 + Math.floor(Math.random() * 5000);

  /* description AI */
  const description = `
Clean ${year} ${make} ${model} ${trim || ""}

• Clean title
• Well maintained
• Great daily driver
• Financing available
• Trade-ins welcome
`;

  /* photo pack */
  const images = [
    { url: "/placeholder-car.png" },
    { url: "/car.png" }
  ];

  const car = await Car.create({
    vin: cleanVin,
    year,
    make,
    model,
    trim,
    title: `${year} ${make} ${model}`,
    price: estimatedPrice,
    mileage: 0,
    description,
    images,
    cost: 0,
    recon: 0,
    marketing: 0,
    docFee: 0,
    isActive: false,
  });

  return NextResponse.json({
    ok: true,
    carId: car._id
  });
}