import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Vin from "@/models/Vin"

export async function GET(){

await connectDB()

for(let i=0;i<5000;i++){

const vin = "JT2BK18U3" + Math.floor(1000000 + Math.random()*9000000)

await Vin.create({ vin })

}

return NextResponse.json({
message:"VIN database created"
})

}