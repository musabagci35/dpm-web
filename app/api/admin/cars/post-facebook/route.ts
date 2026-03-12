import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function POST(req: Request){

try{

await connectDB()

const body = await req.json()

const car:any = await Car.findById(body.carId).lean()

if(!car){
return NextResponse.json({error:"Car not found"}, {status:404})
}

const pageId = process.env.FACEBOOK_PAGE_ID
const token = process.env.FACEBOOK_PAGE_TOKEN

if(!pageId || !token){
return NextResponse.json({
error:"Facebook env variables missing"
},{status:500})
}

const title = `${car.year} ${car.make} ${car.model}`

const text = `
🚗 ${title}

Price: $${car.price || "Contact us"}
Mileage: ${car.mileage || "N/A"}

Financing available.

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}
`

const image =
car.images?.[0]?.url ||
"https://source.unsplash.com/featured/?car"

const url = `https://graph.facebook.com/v19.0/${pageId}/photos`

const fbRes = await fetch(url,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
url:image,
caption:text,
access_token:token
})
})

const data = await fbRes.json()

return NextResponse.json(data)

}catch(err:any){

console.error("FACEBOOK POST ERROR:", err)

return NextResponse.json({
error:"Facebook post failed"
},{status:500})

}

}