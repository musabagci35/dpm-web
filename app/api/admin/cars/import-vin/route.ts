import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"
import VinHistory from "@/models/VinHistory"
import { postToFacebook } from "@/lib/facebookPost"

export async function POST(req: Request) {

try{

await connectDB()

const { vin, dealerId } = await req.json()

if(!vin){
return NextResponse.json({error:"VIN required"},{status:400})
}

// ---------- NHTSA ----------

const nhtsa = await fetch(
`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
)

const nhtsaData = await nhtsa.json()
const results = nhtsaData.Results || []

function find(name:string){
return results.find((r:any)=>r.Variable===name)?.Value || ""
}

const make = find("Make") || "Unknown"
const model = find("Model") || "Unknown"
const year = Number(find("Model Year")) || 2000
const trim = find("Trim")
const engine = find("Engine Model")
const fuel = find("Fuel Type - Primary")
const body = find("Body Class")
const manufacturer = find("Manufacturer Name")
const doors = find("Doors")

// ---------- IMAGE ----------

const image = `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${model}&modelYear=${year}&zoomType=fullscreen&angle=front`

// ---------- DESCRIPTION ----------

const description = `
This ${year} ${make} ${model} ${trim || ""} offers a reliable and efficient driving experience.

Engine: ${engine || "N/A"}
Fuel Type: ${fuel || "N/A"}
Body Style: ${body || "N/A"}

Perfect for commuting with strong reliability and great fuel economy.
`

// ---------- CHECK EXISTING ----------

const existing = await Car.findOne({ vin, dealerId })

if(existing){
return NextResponse.json({
success:true,
carId:existing._id
})
}

// ---------- CREATE CAR ----------

const car = await Car.create({

title:`${year} ${make} ${model}`,

year,
make,
model,
trim,

price:0,
mileage:0,

vin,

bodyStyle:body,
fuelType:fuel,

description,

engine,
doors,
manufacturer,

dealerId: new mongoose.Types.ObjectId(dealerId),

images:[
{
url:image
}
]

})

// ---------- VIN HISTORY ----------

await VinHistory.create({
vin,
make,
model,
year
})

// ---------- AUTO FACEBOOK POST ----------

try{
await postToFacebook(car)
}catch(e){
console.log("Facebook post failed")
}

// ---------- RESPONSE ----------

return NextResponse.json({
success:true,
carId:car._id
})

}catch(err){

console.error("VIN IMPORT ERROR",err)

return NextResponse.json({
error:"VIN import failed"
},{status:500})

}

}