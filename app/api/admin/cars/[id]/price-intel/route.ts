import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  await connectDB();
  const car: any = await Car.findById(id).lean();
  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });

  const make = String(car.make || "").trim();
  const model = String(car.model || "").trim();
  const year = Number(car.year || 0);
  const mileage = Number(car.mileage || 0);

  // Find comps from your own DB (same make+model, close year, published + priced)
  const comps: any[] = await Car.find({
    _id: { $ne: car._id },
    isActive: true,
    make: new RegExp(`^${escapeRegex(make)}$`, "i"),
    model: new RegExp(`^${escapeRegex(model)}$`, "i"),
    price: { $gte: 1000 },
    year: { $gte: year - 2, $lte: year + 2 },
  })
    .select({ price: 1, mileage: 1, year: 1, title: 1 })
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();

  const compPrices = comps.map((c) => Number(c.price || 0)).filter((p) => p > 0);

  // Base retail estimate
  let retailEstimate = 0;

  if (compPrices.length >= 4) {
    retailEstimate = median(compPrices);
  } else {
    // fallback heuristic if not enough comps
    retailEstimate = fallbackRetail({ year, mileage, make, model });
  }

  // Mileage adjustment (per 10k miles away from 12k/year baseline)
  const baseline = Math.max(0, (new Date().getFullYear() - year) * 12000);
  const diff = mileage - baseline;
  const adj = Math.round((-diff / 10000) * 350); // -$350 per +10k miles over baseline
  retailEstimate = clamp(Math.round(retailEstimate + adj), 3500, 250000);

  // Wholesale estimate (auction-ish): retail minus 12–18% depending on age
  const age = Math.max(0, new Date().getFullYear() - year);
  const wholesaleDiscountPct = clampNumber(0.12 + age * 0.01, 0.12, 0.18);
  const wholesaleEstimate = Math.round(retailEstimate * (1 - wholesaleDiscountPct));

  // A reasonable "list price range"
  const retailLow = roundTo100(retailEstimate * 0.95);
  const retailHigh = roundTo100(retailEstimate * 1.05);

  // Default fees (you can change later)
  const recon = 900; // detail, minor fixes, inspection
  const marketing = 250;
  const docFee = 85;

  // Return intel + small sample comps for transparency
  return NextResponse.json({
    vehicle: { id, year, make, model, mileage },
    compsCount: comps.length,
    compsSample: comps.slice(0, 6),
    pricing: {
      retailEstimate: roundTo100(retailEstimate),
      retailRange: { low: retailLow, high: retailHigh },
      wholesaleEstimate: roundTo100(wholesaleEstimate),
      wholesaleDiscountPct,
    },
    defaultCosts: { recon, marketing, docFee },
    notes: compPrices.length >= 4
      ? "Estimate based on your published inventory comps (same make/model, ±2 years)."
      : "Estimate based on fallback heuristic (not enough comps in your DB).",
  });
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function median(arr: number[]) {
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function roundTo100(n: number) {
  return Math.round(n / 100) * 100;
}

function fallbackRetail({
  year,
  mileage,
  make,
  model,
}: {
  year: number;
  mileage: number;
  make: string;
  model: string;
}) {
  // Simple, stable heuristic (better than nothing)
  const age = Math.max(0, new Date().getFullYear() - year);
  let base = 28000;

  const makeBoost: Record<string, number> = {
    TOYOTA: 1800,
    HONDA: 1400,
    LEXUS: 4500,
    BMW: 5500,
    "MERCEDES-BENZ": 6500,
    AUDI: 4500,
    FORD: 0,
    CHEVROLET: -400,
    NISSAN: -900,
    HYUNDAI: -1100,
    KIA: -900,
    TESLA: 6500,
  };

  const modelBoost: Record<string, number> = {
    COROLLA: -1200,
    CAMRY: 600,
    PRIUS: 900,
    CIVIC: -300,
    ACCORD: 900,
    RAV4: 3200,
    "CR-V": 3000,
    CRV: 3000,
    HIGHLANDER: 5200,
    TACOMA: 7200,
    "MODEL 3": 6000,
    "MODEL Y": 9000,
  };

  const uMake = make.toUpperCase();
  const uModel = model.toUpperCase();

  base += makeBoost[uMake] || 0;
  base += modelBoost[uModel] || 0;

  // Depreciation
  base -= age * 1700;

  // Mileage penalty (rough)
  base -= Math.round((mileage / 10000) * 250);

  return clamp(base, 3500, 250000);
}