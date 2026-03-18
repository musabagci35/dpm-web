import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

// ✅ GET (LIST LEADS)
export async function GET() {
  try {
    await connectDB();

    const leads = await Lead.find().sort({ createdAt: -1 });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

// ✅ POST (CREATE LEAD)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    await connectDB();

    const lead = await Lead.create({
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      message: body.message || "",
      source: body.source || "website",
      status: "new",
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("POST LEAD ERROR:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}