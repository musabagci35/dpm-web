import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import Car from "@/models/Car";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { carId, customerName, phone, email, message } = body;

    /* BASIC VALIDATION */

    if (!carId || !customerName || !phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const car: any = await Car.findById(carId).lean();

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    /* CREATE LEAD */

    const lead = await Lead.create({
      dealerId: car.dealerId || null,
      carId,
      carTitle: `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim(),
      customerName,
      phone,
      email,
      message,
      status: "new",
    });

    return NextResponse.json({
      success: true,
      leadId: lead._id,
    });

  } catch (error: any) {

    console.error("LEAD ERROR:", error);

    return NextResponse.json(
      { error: "Lead creation failed" },
      { status: 500 }
    );
  }
}