import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  await connectDB();

  const car: any = await Car.findById(id).lean();

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  const vin = String(car.vin || "").trim().toUpperCase();
  const retailPrice = Number(car.price || 0);
  const cost = Number(car.cost || 0);
  const recon = Number(car.recon || 0);
  const marketing = Number(car.marketing || 0);
  const docFee = Number(car.docFee || 0);
  const mileage = Number(car.mileage || 0);
  const year = Number(car.year || 0);
  const make = String(car.make || "");
  const model = String(car.model || "");
  const bodyStyle = String(car.bodyStyle || "");

  const totalCost = cost + recon + marketing + docFee;
  const expectedProfit = retailPrice - totalCost;

  const estimatedAuctionValue = round100(
    estimateAuctionValue({ year, make, model, mileage, retailPrice })
  );

  const buyLimit = round100(
    Math.max(0, retailPrice - recon - marketing - docFee - 2500)
  );

  const vinRisk = estimateVinRisk({ year, bodyStyle, mileage });
  const marginRisk = estimateMarginRisk(expectedProfit);
  const reconRisk = recon > 2000 ? 20 : recon > 1000 ? 10 : 0;

  const riskScore = Math.min(100, vinRisk + marginRisk + reconRisk);

  const titleStatus = "unknown";
  const accidentCount = 0;

  let recommendation = "MAYBE";
  if (riskScore >= 70 || expectedProfit <= 0) recommendation = "AVOID";
  else if (expectedProfit >= 3000 && riskScore <= 35) recommendation = "BUY";

  const notes = buildNotes({
    expectedProfit,
    riskScore,
    mileage,
    recon,
    buyLimit,
    retailPrice,
  });

  return NextResponse.json({
    ok: true,
    vehicle: {
      vin,
      year,
      make,
      model,
      mileage,
      bodyStyle,
    },
    pricing: {
      retailPrice: round100(retailPrice),
      estimatedAuctionValue,
      buyLimit,
      totalCost: round100(totalCost),
      expectedProfit: round100(expectedProfit),
    },
    title: {
      status: titleStatus,
      accidentCount,
    },
    decision: {
      recommendation,
      riskScore,
      notes,
    },
  });
}

function estimateAuctionValue({
  year,
  make,
  model,
  mileage,
  retailPrice,
}: {
  year: number;
  make: string;
  model: string;
  mileage: number;
  retailPrice: number;
}) {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - year);

  let base = retailPrice > 0 ? retailPrice * 0.78 : 12000;

  const makeAdj: Record<string, number> = {
    TOYOTA: 800,
    HONDA: 700,
    LEXUS: 1200,
    BMW: 600,
    TESLA: 1000,
    FORD: 0,
    CHEVROLET: -200,
    NISSAN: -300,
  };

  const modelAdj: Record<string, number> = {
    CAMRY: 500,
    COROLLA: 300,
    PRIUS: 700,
    CIVIC: 300,
    ACCORD: 500,
    RAV4: 1200,
    "CR-V": 1000,
    TACOMA: 1800,
    HIGHLANDER: 1400,
    "MODEL 3": 1500,
    "MODEL Y": 2200,
  };

  const uMake = make.toUpperCase();
  const uModel = model.toUpperCase();

  base += makeAdj[uMake] || 0;
  base += modelAdj[uModel] || 0;
  base -= age * 250;
  base -= Math.round((mileage / 10000) * 120);

  return Math.max(2500, base);
}

function estimateVinRisk({
  year,
  bodyStyle,
  mileage,
}: {
  year: number;
  bodyStyle: string;
  mileage: number;
}) {
  let score = 20;

  if (year < 2012) score += 20;
  if (mileage > 120000) score += 20;
  if (mileage > 180000) score += 15;

  const body = bodyStyle.toLowerCase();
  if (body.includes("truck")) score += 10;
  if (body.includes("pickup")) score += 10;

  return score;
}

function estimateMarginRisk(expectedProfit: number) {
  if (expectedProfit <= 0) return 40;
  if (expectedProfit < 1500) return 30;
  if (expectedProfit < 3000) return 15;
  return 5;
}

function buildNotes({
  expectedProfit,
  riskScore,
  mileage,
  recon,
  buyLimit,
  retailPrice,
}: {
  expectedProfit: number;
  riskScore: number;
  mileage: number;
  recon: number;
  buyLimit: number;
  retailPrice: number;
}) {
  const notes: string[] = [];

  if (expectedProfit >= 3000) notes.push("Strong margin opportunity.");
  if (expectedProfit > 0 && expectedProfit < 3000) notes.push("Usable margin, but not very wide.");
  if (expectedProfit <= 0) notes.push("Projected profit is weak or negative.");

  if (mileage > 120000) notes.push("Higher mileage increases resale risk.");
  if (recon > 2000) notes.push("Reconditioning cost is elevated.");
  if (riskScore >= 70) notes.push("Overall risk is high.");
  if (buyLimit < retailPrice * 0.7) notes.push("Keep bids disciplined to protect margin.");

  return notes;
}

function round100(n: number) {
  return Math.round(n / 100) * 100;
}