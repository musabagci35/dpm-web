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

const title = `${car.year} ${car.make} ${car.model}`

const description = `
${car.year} ${car.make} ${car.model}

Price: $${car.price}
Mileage: ${car.mileage}

Clean title
Financing available

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}

Call/Text 916-261-8880
`

return NextResponse.json({
title,
price:car.price,
description,
image:car.images?.[0]?.url
})

}