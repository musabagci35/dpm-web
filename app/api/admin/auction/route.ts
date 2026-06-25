import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";

function calcDecision(profit: number) {
  if (profit >= 4000) return "bid";
  if (profit <= 1500) return "pass";
  return "watch";
}

export async function GET() {
  await connectDB();

  const lots = await AuctionVehicle.find()
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, lots });
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const bid = Number(body.buyNowPrice || body.currentBid || 0);
    const totalCost =
      bid +
      Number(body.auctionFees || 0) +
      Number(body.transportCost || 0) +
      Number(body.repairEstimate || 0) +
      Number(body.otherCost || 0);

    const estimatedProfit = Number(body.targetRetailPrice || 0) - totalCost;

    const lot = await AuctionVehicle.create({
      auction: body.auction || "copart",
      lotNumber: body.lotNumber || "",
      vin: body.vin || "",
      year: Number(body.year || 0),
      make: body.make || "",
      model: body.model || "",
      trim: body.trim || "",
      titleStatus: body.titleStatus || "unknown",
      damageType: body.damageType || "",
      runAndDrive: Boolean(body.runAndDrive),
      hasKeys: Boolean(body.hasKeys),
      auctionDate: body.auctionDate || null,
      auctionUrl: body.auctionUrl || "",
      currentBid: Number(body.currentBid || 0),
      buyNowPrice: Number(body.buyNowPrice || 0),
      auctionFees: Number(body.auctionFees || 0),
      transportCost: Number(body.transportCost || 0),
      repairEstimate: Number(body.repairEstimate || 0),
      otherCost: Number(body.otherCost || 0),
      targetRetailPrice: Number(body.targetRetailPrice || 0),
      maxBid: Number(body.maxBid || 0),
      totalCost,
      estimatedProfit,
      decision: body.decision || calcDecision(estimatedProfit),
      notes: body.notes || "",
      images: Array.isArray(body.images) ? body.images : [],
    });

    return NextResponse.json({ success: true, lot }, { status: 201 });
  } catch (error: any) {
    console.error("AUCTION CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create auction lot" },
      { status: 500 }
    );
  }
}
