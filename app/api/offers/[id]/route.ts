import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const { action, counterAmount } = body;

    const update: {
      status?: string;
      counterAmount?: number;
    } = {};

    if (action === "accept") {
      update.status = "accepted";
    } else if (action === "reject") {
      update.status = "rejected";
    } else if (action === "counter") {
      const amount = Number(counterAmount);

      if (!amount || isNaN(amount)) {
        return NextResponse.json(
          { error: "Invalid counterAmount" },
          { status: 400 }
        );
      }

      update.status = "countered";
      update.counterAmount = amount;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const offer = await Offer.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();

    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    console.error("PATCH /api/offers/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}