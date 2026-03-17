import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {

  const { vin } = await req.json();

  const vinRes = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
  );

  const data = await vinRes.json();

  const car = data.Results[0];

  const make = car.Make;
  const model = car.Model;
  const year = car.ModelYear;

  const description = `
${year} ${make} ${model}

Clean and reliable vehicle ready for daily driving.

Drive Prime Motors
Rancho Cordova CA
`;

  await connectDB();

  const newCar = await Car.create({
    vin,
    make,
    model,
    year,
    description,
  });

  return NextResponse.json(newCar);
}