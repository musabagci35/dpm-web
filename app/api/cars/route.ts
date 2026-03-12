import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function GET() {

  await connectDB()

  const cars = await Car.find({})
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(cars)
}