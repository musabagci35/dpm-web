import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { carId, buyerName, buyerPhone, buyerEmail, amount } = body;

    if (!carId || !mongoose.Types.ObjectId.isValid(carId)) {
      return NextResponse.json({ error: "Invalid carId" }, { status: 400 });
    }
    if (!buyerName || !buyerPhone || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const offer = await Offer.create({
      carId,
      buyerName: String(buyerName).trim(),
      buyerPhone: String(buyerPhone).trim(),
      buyerEmail: buyerEmail ? String(buyerEmail).trim() : "",
      amount: Number(amount),
      status: "pending",
    });

    return NextResponse.json({ ok: true, offer }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/offers error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const carId = searchParams.get("carId");
    const status = searchParams.get("status");

    const query: any = {};
    if (carId && mongoose.Types.ObjectId.isValid(carId)) query.carId = carId;
    if (status) query.status = status;

    const offers = await Offer.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, offers });
  } catch (e: any) {
    console.error("GET /api/offers error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}