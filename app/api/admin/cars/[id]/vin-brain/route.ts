import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function GET(req:Request,{params}:{params:{id:string}}){

await connectDB()

const car:any = await Car.findById(params.id).lean()

if(!car){
return NextResponse.json({error:"car not found"},{status:404})
}

const vin = car.vin

if(!vin){
return NextResponse.json({error:"VIN missing"})
}

const res = await fetch(
`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
)

const data = await res.json()

const results = data.Results || []

const pick = (name:string)=>
results.find((r:any)=>r.Variable===name)?.Value || ""

const year = Number(pick("Model Year"))
const make = pick("Make")
const model = pick("Model")
const body = pick("Body Class")

// basit risk tahmini

let risk = "LOW"

if(body.includes("Truck")) risk = "MEDIUM"
if(year < 2010) risk = "HIGH"

return NextResponse.json({

vin,
year,
make,
model,
body,
risk,

analysis:{

possibleTitle:"unknown",
possibleAccidentRisk:risk,
note:"Free VIN decode. History check requires paid provider."

}

})

}