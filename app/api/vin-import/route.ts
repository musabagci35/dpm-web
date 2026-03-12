import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const { vin } = await req.json()

  if (!vin) {
    return NextResponse.json({ error: "VIN required" })
  }

  // ---------------- NHTSA VIN DECODE ----------------

  const vinRes = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
  )

  const vinData = await vinRes.json()

  const v = vinData.Results?.[0] || {}

  const make = v.Make || ""
  const model = v.Model || ""
  const year = v.ModelYear || ""
  const trim = v.Trim || ""
  const body = v.BodyClass || ""
  const engine = v.EngineModel || ""
  const fuel = v.FuelTypePrimary || ""
  const doors = v.Doors || ""
  const transmission = v.TransmissionStyle || ""
  const manufacturer = v.Manufacturer || ""

  // ---------------- CARQUERY (horsepower) ----------------

  let horsepower = ""

  try {

    const cq = await fetch(
      `https://www.carqueryapi.com/api/0.3/?callback=?&cmd=getTrims&make=${make}&model=${model}`
    )

    const txt = await cq.text()

    const json = JSON.parse(
      txt.replace("?(", "").replace(");", "")
    )

    horsepower = json?.Trims?.[0]?.model_engine_power_ps || ""

  } catch (e) {}

  // ---------------- VINAUDIT (title check) ----------------

  let titleStatus = "unknown"
  let odometerStatus = "unknown"
  let brands: string[] = []

  try {

    const API_KEY = process.env.VINAUDIT_API_KEY

    const audit = await fetch(
      `https://api.vinaudit.com/v2/vehicle?key=${API_KEY}&vin=${vin}`
    )

    const auditData = await audit.json()

    titleStatus = (auditData?.title || "unknown").toLowerCase()
    odometerStatus = auditData?.odometer_status || "unknown"
    brands = auditData?.brands || []

  } catch (e) {}

  // ---------------- VEHICLE PHOTO ----------------

  const image = `https://cdn.imagin.studio/getimage?customer=img&make=${make}&modelFamily=${model}&modelYear=${year}&zoomType=fullscreen`

  // ---------------- AUTO TITLE ----------------

  const title = `${year} ${make} ${model} ${trim}`.trim()

  // ---------------- DESCRIPTION ----------------

  const description = `
This ${year} ${make} ${model} ${trim ?? ""} offers a reliable and efficient driving experience.

Engine: ${engine || "N/A"}
Horsepower: ${horsepower || "N/A"}
Fuel Type: ${fuel || "N/A"}
Body Style: ${body || "N/A"}
Transmission: ${transmission || "N/A"}

Perfect for daily commuting with modern safety features and excellent reliability.
`.trim()

  // ---------------- RESPONSE ----------------

  return NextResponse.json({

    vin,

    title,

    make,
    model,
    year,
    trim,

    engine,
    horsepower,
    doors,
    manufacturer,

    fuel,
    body,
    transmission,

    titleStatus,

    salvage: brands.includes("salvage"),
    flood: brands.includes("flood"),
    junk: brands.includes("junk"),

    odometerStatus,

    description,

    image

  })
}