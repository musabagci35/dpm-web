import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const { vin } = await req.json()

  if (!vin) {
    return NextResponse.json({ error: "VIN required" })
  }

  // ---------------- NHTSA VIN DECODE ----------------

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
  )

  const data = await res.json()

  const car = data.Results?.[0] || {}

  const year = car.ModelYear || ""
  const make = car.Make || ""
  const model = car.Model || ""
  const trim = car.Trim || ""

  const body = car.BodyClass || ""
  const doors = car.Doors || ""

  const engine = car.EngineModel || ""
  const engineCylinders = car.EngineCylinders || ""
  const engineDisplacement = car.DisplacementL || ""

  const fuel = car.FuelTypePrimary || ""
  const drive = car.DriveType || ""
  const transmission = car.TransmissionStyle || ""

  const plantCountry = car.PlantCountry || ""
  const plantCompany = car.PlantCompanyName || ""

  const manufacturer = car.Manufacturer || ""

  // ---------------- TITLE / BRANDS DEFAULT ----------------

  const titleStatus = "unknown"
  const odometerStatus = "unknown"

  const brands: string[] = []

  // ---------------- IMAGE ----------------

  const image = `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${model}&modelYear=${year}&zoomType=fullscreen`

  const images = [image]

  // ---------------- DESCRIPTION ----------------

  const description = `
This ${year} ${make} ${model} ${trim ?? ""} offers a reliable and efficient driving experience.

Engine: ${engine || "N/A"}
Fuel Type: ${fuel || "N/A"}
Body Style: ${body || "N/A"}
Transmission: ${transmission || "N/A"}
`.trim()

  // ---------------- RESPONSE ----------------

  return NextResponse.json({

    vin,

    title: `${year} ${make} ${model}`,

    year,
    make,
    model,
    trim,

    body,
    doors,

    engine,
    engineCylinders,
    engineDisplacement,

    fuel,
    drive,
    transmission,

    plantCountry,
    plantCompany,

    manufacturer,

    titleStatus,

    salvage: brands.includes("salvage"),
    flood: brands.includes("flood"),
    junk: brands.includes("junk"),

    odometerStatus,

    description,

    images

  })

}