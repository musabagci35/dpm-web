import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function POST(req:Request){

await connectDB()

const body = await req.json()

const car:any = await Car.findById(body.carId).lean()

if(!car){
return NextResponse.json({error:"Car not found"})
}

const pageId = process.env.FACEBOOK_PAGE_ID
const token = process.env.FACEBOOK_PAGE_TOKEN

const title = `${car.year} ${car.make} ${car.model}`

const text = `
🚗 ${title}

Price: $${car.price}
Mileage: ${car.mileage}

Financing available.

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}
`

const image = car.images?.[0]?.url

const url = `https://graph.facebook.com/v19.0/${pageId}/photos`

const res = await fetch(url,{
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

const data = await res.json()

return NextResponse.json(data)

}