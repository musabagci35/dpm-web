import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import OpenAI from "openai";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  await connectDB();
  const car: any = await Car.findById(id).lean();
  if (!car) return NextResponse.json({ error: "Car not found" }, { status: 404 });

  // If no OpenAI key -> fallback (still works)
  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildFallbackListing(car);
    return NextResponse.json({ ok: true, mode: "fallback", ...fallback });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are an automotive dealership copywriter for Drive Prime Motors (Sacramento, CA).
Write a clean, professional listing in US English. Avoid Turkish.
Do not mention "AI" or "generated".

Vehicle data:
- Year: ${car.year ?? ""}
- Make: ${car.make ?? ""}
- Model: ${car.model ?? ""}
- Trim: ${car.trim ?? ""}
- Body Style: ${car.bodyStyle ?? ""}
- Fuel: ${car.fuelType ?? ""}
- Transmission: ${car.transmission ?? ""}
- Drivetrain: ${car.drivetrain ?? ""}
- Cylinders: ${car.cylinders ?? ""}
- Displacement(L): ${car.displacementL ?? ""}
- Mileage: ${car.mileage ?? ""}
- Price: ${car.price ?? ""}

Return STRICT JSON with keys:
title, subtitle, bullets (array of 6-10 strings), description (3-6 short paragraphs), keywords (array of 8-14 strings).
`;

  const r = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    // Force JSON output
    text: { format: { type: "json_object" } },
  });

  const text = r.output_text?.trim() || "";
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    const fallback = buildFallbackListing(car);
    return NextResponse.json({ ok: true, mode: "fallback_parse", ...fallback });
  }

  // Minimal validation / cleanup
  const listing = {
    title: String(json.title || `${car.year} ${car.make} ${car.model}`).trim(),
    subtitle: String(json.subtitle || "Available now at Drive Prime Motors.").trim(),
    bullets: Array.isArray(json.bullets) ? json.bullets.map((s: any) => String(s)).slice(0, 12) : [],
    description: String(json.description || "").trim(),
    keywords: Array.isArray(json.keywords) ? json.keywords.map((s: any) => String(s)).slice(0, 20) : [],
  };

  return NextResponse.json({ ok: true, mode: "openai", ...listing });
}

function buildFallbackListing(car: any) {
  const title = `${car.year ?? ""} ${car.make ?? ""} ${car.model ?? ""}${car.trim ? ` ${car.trim}` : ""}`.trim();

  const bullets = [
    car.bodyStyle ? `${car.bodyStyle}` : null,
    car.fuelType ? `Fuel: ${car.fuelType}` : null,
    car.transmission ? `Transmission: ${car.transmission}` : null,
    car.drivetrain ? `Drivetrain: ${car.drivetrain}` : null,
    car.mileage ? `Mileage: ${Number(car.mileage).toLocaleString()} miles` : null,
    "Clean presentation and strong daily usability",
    "Financing options available",
    "Trade-ins welcome",
  ].filter(Boolean) as string[];

  const subtitle = "Available now at Drive Prime Motors in Sacramento, CA.";

  const description = [
    `${title} is available now at Drive Prime Motors.`,
    `A solid option for buyers looking for value, reliability, and comfort.`,
    `Contact us for availability, financing options, and to schedule a test drive.`,
  ].join("\n\n");

  const keywords = [
    `${car.make ?? ""}`.trim(),
    `${car.model ?? ""}`.trim(),
    `${car.year ?? ""}`.trim(),
    "used car",
    "Sacramento",
    "financing",
    "trade-in",
    "Drive Prime Motors",
  ].filter(Boolean);

  return { title, subtitle, bullets, description, keywords };
}