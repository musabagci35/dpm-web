import { connectDB } from "@/lib/mongodb"
import Car from "@/models/Car"

export async function GET(){

await connectDB()

const cars = await Car.find({isActive:true}).lean()

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<vehicles>`

for(const car of cars){

xml += `
<vehicle>
<title>${car.year} ${car.make} ${car.model}</title>
<price>${car.price} USD</price>
<mileage>${car.mileage}</mileage>
<vin>${car.vin}</vin>
<link>https://driveprimemotorsllc.com/inventory/${car._id}</link>
<image>${car.images?.[0]?.url || ""}</image>
<condition>used</condition>
</vehicle>
`

}

xml += `</vehicles>`

return new Response(xml,{
headers:{
"Content-Type":"application/xml"
}
})

}