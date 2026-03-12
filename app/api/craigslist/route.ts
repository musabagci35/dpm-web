import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export async function POST(req: Request) {

  await connectDB()

  const body = await req.json()

  const car:any = await Car.findById(body.carId).lean()

  if(!car){
    return NextResponse.json({error:"Car not found"})
  }

  const title =
    `${car.year} ${car.make} ${car.model} - Financing Available`

  const description = `

${car.year} ${car.make} ${car.model}

Price: $${car.price}

Mileage: ${car.mileage}

VIN: ${car.vin || "N/A"}

Clean title.

Financing available.

Drive Prime Motors
Sacramento CA

Call or text:
916-261-8880

View more vehicles:
https://driveprimemotorsllc.com/inventory

`

  return NextResponse.json({
    title,
    description
  })

}