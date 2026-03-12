import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function GET() {

  await connectDB();

  const total = await Lead.countDocuments({})

  const newLeads = await Lead.countDocuments({
    status:"new"
  })

  const contacted = await Lead.countDocuments({
    status:"contacted"
  })

  const won = await Lead.countDocuments({
    status:"won"
  })

  const lost = await Lead.countDocuments({
    status:"lost"
  })

  return NextResponse.json({
    total,
    newLeads,
    contacted,
    won,
    lost
  })

}