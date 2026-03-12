import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const p = await Promise.resolve(params);
    const id = p.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
    }

    await connectDB();
    const body = await req.json();

    const { action, counterAmount } = body;

    let update: any = {};

    if (action === "accept") update.status = "accepted";
    else if (action === "reject") update.status = "rejected";
    else if (action === "counter") {
      update.status = "countered";
      update.counterAmount = Number(counterAmount);
      if (!update.counterAmount || isNaN(update.counterAmount)) {
        return NextResponse.json({ error: "Invalid counterAmount" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const offer = await Offer.findByIdAndUpdate(id, update, { new: true }).lean();
    return NextResponse.json({ ok: true, offer });
  } catch (e: any) {
    console.error("PATCH /api/offers/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}