import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function POST(req:Request){

const body = await req.json()

const make = body.make

await connectDB()

const cars = await Car.find({ make }).limit(6).lean()

return NextResponse.json(cars)

}