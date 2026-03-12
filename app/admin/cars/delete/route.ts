import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function POST(req:Request){

await connectDB()

const {id} = await req.json()

await Car.findByIdAndDelete(id)

return NextResponse.json({success:true})

}