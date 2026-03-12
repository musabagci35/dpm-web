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

  const retailPrice = Number(car.price || 0);
  const cost = Number(car.cost || 0);
  const recon = Number(car.recon || 0);
  const marketing = Number(car.marketing || 0);
  const docFee = Number(car.docFee || 0);
  const mileage = Number(car.mileage || 0);

  let mmr: number | null = null;
  let source = "fallback";

  // Optional real MMR integration
  // If you later get Manheim/Cox credentials, replace this block with their auth + valuation call.
  // Officially, Manheim provides valuation/MMR API products, but access is credentialed. :contentReference[oaicite:1]{index=1}
  if (process.env.MANHEIM_MMR_ENABLED === "true") {
    try {
      // Placeholder for future real integration
      // const token = await getManheimToken(...)
      // const mmrRes = await fetch(...)
      // const mmrData = await mmrRes.json()
      // mmr = Number(mmrData.adjustedMmr || mmrData.baseMmr || 0)

      // temporary safe fallback until credentials are wired
      mmr = estimateAuctionValue({
        year: Number(car.year || 0),
        make: String(car.make || ""),
        model: String(car.model || ""),
        mileage,
        retailPrice,
      });
      source = "mmr_stub";
    } catch {
      mmr = null;
    }
  }

  if (mmr == null) {
    mmr = estimateAuctionValue({
      year: Number(car.year || 0),
      make: String(car.make || ""),
      model: String(car.model || ""),
      mileage,
      retailPrice,
    });
  }

  const totalCost = cost + recon + marketing + docFee;
  const expectedProfit = retailPrice - totalCost;
  const buyLimit = Math.max(0, retailPrice - recon - marketing - docFee - 2500);

  let recommendation = "HOLD";
  if (expectedProfit >= 3000) recommendation = "BUY";
  if (expectedProfit > 0 && expectedProfit < 3000) recommendation = "MAYBE";
  if (expectedProfit <= 0) recommendation = "SKIP";

  const riskScore = getRiskScore({
    retailPrice,
    mileage,
    recon,
    expectedProfit,
  });

  return NextResponse.json({
    ok: true,
    source,
    vehicle: {
      year: car.year,
      make: car.make,
      model: car.model,
      vin: car.vin || "",
      mileage,
    },
    pricing: {
      retailPrice,
      estimatedAuctionValue: round100(mmr),
      buyLimit: round100(buyLimit),
      totalCost: round100(totalCost),
      expectedProfit: round100(expectedProfit),
    },
    decision: {
      recommendation,
      riskScore,
      notes: buildNotes({
        recommendation,
        expectedProfit,
        mileage,
        recon,
      }),
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

function getRiskScore({
  retailPrice,
  mileage,
  recon,
  expectedProfit,
}: {
  retailPrice: number;
  mileage: number;
  recon: number;
  expectedProfit: number;
}) {
  let risk = 20;

  if (mileage > 120000) risk += 20;
  if (recon > 2000) risk += 20;
  if (retailPrice < 8000) risk += 10;
  if (expectedProfit < 1500) risk += 25;
  if (expectedProfit <= 0) risk += 15;

  return Math.min(100, risk);
}

function buildNotes({
  recommendation,
  expectedProfit,
  mileage,
  recon,
}: {
  recommendation: string;
  expectedProfit: number;
  mileage: number;
  recon: number;
}) {
  const notes = [];

  if (recommendation === "BUY") {
    notes.push("Strong margin based on current inputs.");
  }
  if (recommendation === "MAYBE") {
    notes.push("Potential deal, but margin is not very wide.");
  }
  if (recommendation === "SKIP") {
    notes.push("Projected margin is weak or negative.");
  }
  if (mileage > 120000) {
    notes.push("Higher mileage increases resale risk.");
  }
  if (recon > 2000) {
    notes.push("Reconditioning cost is elevated.");
  }
  if (expectedProfit < 1500) {
    notes.push("Low margin after estimated costs.");
  }

  return notes;
}

function round100(n: number) {
  return Math.round(n / 100) * 100;
}