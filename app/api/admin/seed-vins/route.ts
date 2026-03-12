import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Vin from "@/models/Vin";

export async function POST() {
  await connectDB();

  const seedList = [
    { vin: "JT2BK18U330072081", make: "TOYOTA", model: "Prius", year: "2003" },
    { vin: "JTDKB20U867517631", make: "TOYOTA", model: "Prius", year: "2006" },
    { vin: "JTDKN3DU9E1773558", make: "TOYOTA", model: "Prius", year: "2014" },
    { vin: "5YFB4MDE9RP116097", make: "TOYOTA", model: "Corolla", year: "2024" },
    { vin: "1GCHTBEA4H1291535", make: "CHEVROLET", model: "Colorado", year: "2017" },
    { vin: "3FMCR9062MRA79102", make: "FORD", model: "Bronco", year: "1991" },
  ];

  for (const item of seedList) {
    await Vin.updateOne(
      { vin: item.vin },
      { $set: item },
      { upsert: true }
    );
  }

  return NextResponse.json({
    success: true,
    inserted: seedList.length,
  });
}