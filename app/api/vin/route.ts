import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { vin } = await req.json();

  if (!vin) {
    return NextResponse.json({ error: "VIN required" });
  }

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
  );

  const data = await res.json();

  const results = data.Results;

  const vehicle = {
    make: results.find((r:any)=>r.Variable==="Make")?.Value || "",
    model: results.find((r:any)=>r.Variable==="Model")?.Value || "",
    year: results.find((r:any)=>r.Variable==="Model Year")?.Value || "",
    engine: results.find((r:any)=>r.Variable==="Engine Model")?.Value || "",
    fuel: results.find((r:any)=>r.Variable==="Fuel Type - Primary")?.Value || "",
    body: results.find((r:any)=>r.Variable==="Body Class")?.Value || ""
  };

  return NextResponse.json(vehicle);
}