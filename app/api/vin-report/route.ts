import { NextResponse } from "next/server"

export async function POST(req:Request){

const body = await req.json()
const vin = body.vin

const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`

const res = await fetch(url)
const json = await res.json()

const car = json.Results[0]

/* FAKE MARKET VALUE */

const marketLow = 12000 + Math.floor(Math.random()*2000)
const marketHigh = marketLow + 3000

/* AUCTION INTELLIGENCE */

const auctionPrice = marketLow - 2500
const auctionLocation = "California"
const auctionDamage = ["Front End","Rear Damage","Side Damage","Minor Dent"][Math.floor(Math.random()*4)]

return NextResponse.json({

make: car.Make,
model: car.Model,
year: car.ModelYear,
engine: car.EngineModel,
fuel: car.FuelTypePrimary,
body: car.BodyClass,

market_low: marketLow,
market_high: marketHigh,

auction_price: auctionPrice,
auction_location: auctionLocation,
auction_damage: auctionDamage

})

}