import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Car from "@/models/Car";
import { connectDB } from "@/lib/db";

function money(n: any) {
  return Number(n || 0);
}

function detectTitleStatus(titleCode = "", current = "unknown") {
  const text = `${titleCode} ${current}`.toLowerCase();

  if (text.includes("salvage")) return "salvage";
  if (text.includes("rebuilt")) return "rebuilt";
  if (text.includes("parts")) return "parts_only";
  if (text.includes("junk")) return "parts_only";
  if (text.includes("clean")) return "clean";

  return current || "unknown";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vehicle id" }, { status: 400 });
    }

    const car: any = await Car.findById(id).lean();

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const titleStatus = detectTitleStatus(car.titleCode, car.titleStatus);

    const retail =
      money(car.expectedRetail) ||
      money(car.estimatedRetailValue) ||
      money(car.price);

    const repairEstimate = money(car.recon) || 2300;
    const shippingEstimate = money(car.transportCost) || 650;
    const auctionFees = money(car.auctionFee) || 780;

    const totalInvestment =
      money(car.cost) +
      repairEstimate +
      shippingEstimate +
      auctionFees +
      money(car.registrationFee) +
      money(car.smogFee) +
      money(car.detailCost) +
      money(car.docFee) +
      money(car.salesTax);

    const expectedProfit = retail - totalInvestment;

    let score = 70;
    const notes: string[] = [];

    if (car.make?.toLowerCase().includes("honda")) {
      score += 8;
      notes.push("Honda has strong resale demand.");
    }

    if (car.make?.toLowerCase().includes("toyota")) {
      score += 8;
      notes.push("Toyota has strong resale demand.");
    }

    if (money(car.mileage) > 0 && money(car.mileage) < 60000) {
      score += 8;
      notes.push("Mileage is attractive for resale.");
    }

    if (car.runAndDrive) {
      score += 8;
      notes.push("Run & Drive status is positive.");
    }

    if (car.engineStarts) {
      score += 5;
      notes.push("Engine starts.");
    }

    if (car.transmissionEngages) {
      score += 5;
      notes.push("Transmission engages.");
    }

    if (titleStatus === "salvage") {
      score -= 18;
      notes.push("Salvage title lowers resale value and increases risk.");
    }

    const damageText = `${car.primaryDamage || ""} ${car.secondaryDamage || ""}`.toLowerCase();

    if (damageText.includes("front")) {
      score -= 7;
      notes.push("Front end damage may require inspection.");
    }

    if (damageText.includes("frame")) {
      score -= 25;
      notes.push("Frame damage is a major risk.");
    }

    if (expectedProfit > 3000) {
      score += 8;
      notes.push("Projected profit is strong.");
    } else if (expectedProfit < 1000) {
      score -= 15;
      notes.push("Projected profit is weak.");
    }

    score = Math.max(0, Math.min(100, score));

    const recommendation =
      score >= 75 && expectedProfit > 1500
        ? "BUY"
        : score >= 60
        ? "WATCH"
        : "PASS";

    const roi =
      totalInvestment > 0
        ? Number(((expectedProfit / totalInvestment) * 100).toFixed(1))
        : 0;

    return NextResponse.json({
      recommendation,
      confidence: score,
      titleStatus,
      titleCode: car.titleCode || "",
      maxBid: Math.max(0, retail - repairEstimate - shippingEstimate - auctionFees - 2500),
      repairEstimate,
      shippingEstimate,
      auctionFees,
      totalInvestment,
      expectedRetail: retail,
      expectedProfit,
      roi,
      risk: score >= 75 ? "LOW" : score >= 60 ? "MEDIUM" : "HIGH",
      notes,
    });
  } catch (err) {
    console.error("Dealer Assistant failed:", err);
    return NextResponse.json({ error: "Dealer Assistant failed" }, { status: 500 });
  }
}
