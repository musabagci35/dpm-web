import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const body = await req.json()

  const year = parseInt(body.year)

  const currentYear = new Date().getFullYear()

  const age = currentYear - year

  const basePrice = 30000

  const depreciation = age * 1500

  const marketValue = Math.max(basePrice - depreciation, 2000)

  const low = Math.floor(marketValue * 0.8)
  const high = Math.floor(marketValue * 1.2)

  const dealerBuy = Math.floor(low * 0.8)

  return NextResponse.json({
    marketLow: low,
    marketHigh: high,
    dealerBuy
  })

}