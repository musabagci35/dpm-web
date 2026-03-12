import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

type Ctx = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, ctx: Ctx) {

  const { id } = await ctx.params

  await connectDB()

  const car: any = await Car.findById(id).lean()

  if (!car) {
    return NextResponse.json(
      { error: "Car not found" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    vin: car.vin,
    price: car.price,
    marketPrice: car.marketPrice,
    mileage: car.mileage
  })

}