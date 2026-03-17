import { NextResponse } from "next/server"

export async function POST(req: Request){

const { vin } = await req.json()

if(!vin){
return NextResponse.json({error:"VIN required"})
}

const links = {

bidfax:`https://bidfax.info/search/${vin}`,

statvin:`https://stat.vin/cars/${vin}`,

poctra:`https://poctra.com/search?query=${vin}`,

copart:`https://www.copart.com/lotSearchResults?free=true&query=${vin}`,

iaai:`https://www.iaai.com/Search?SearchVIN=${vin}`

}

return NextResponse.json({
success:true,
links
})

}