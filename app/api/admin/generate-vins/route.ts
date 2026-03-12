import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Vin from "@/models/Vin"

export async function GET(){

await connectDB()

const vins = []

for(let i=0;i<500;i++){

const vin = "VIN"+Math.floor(Math.random()*100000000)

vins.push({vin})

}

await Vin.insertMany(vins)

return NextResponse.json({

created:vins.length

})

}