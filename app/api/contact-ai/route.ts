import { NextResponse } from "next/server";
import OpenAI from "openai";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";
import { rateLimit } from "@/lib/rateLimit";

const MAX_MESSAGE_LENGTH = 1000;
const INVENTORY_CONTEXT_LIMIT = 8;

/**
 * Real, curated dealership facts only — never scraped or inferred. This is
 * intentionally a small in-code list rather than a database-backed
 * FaqEntry model: it's the same "answer only from approved content"
 * requirement from the Phase 1 messaging design, scoped down to what this
 * single-turn Contact Center assistant actually needs.
 */
const DEALERSHIP_FAQ = `
- Location: Rancho Cordova, California (serving the greater Sacramento area).
- Phone: (916) 261-8880.
- Hours: Mon-Fri 9:00 AM - 6:00 PM, Saturday by appointment, Sunday 10:00 AM - 5:00 PM.
- Financing: Drive Prime Motors works with many credit situations and can discuss financing options — final approval and terms are decided by the lender, never guaranteed in advance.
- Trade-ins: welcome: a specific trade-in value requires an in-person or phone appraisal.
- Sell My Car: private sellers can list a vehicle for a flat listing fee (stays live 30 days), with an optional featured upgrade, or start an auction instead.
- Free VIN check: decodes factory specs and checks for open NHTSA safety recalls from the VIN alone. It is NOT a full vehicle history report (no accident, title, or ownership history) and is not a Carfax/AutoCheck report.
`.trim();

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function vehicleLine(c: any): string {
  const parts = [c.year, c.make, c.model, c.trim].filter(Boolean).join(" ");
  const price = c.price ? `$${Number(c.price).toLocaleString()}` : "price on request";
  const mileage = c.mileage ? `${Number(c.mileage).toLocaleString()} miles` : "";
  return `${parts} - ${price}${mileage ? ` - ${mileage}` : ""}`;
}

/**
 * Single-turn Contact Center AI Assistant. Server-side only, grounded
 * strictly in the real inventory context assembled below plus the fixed
 * DEALERSHIP_FAQ text above — the system prompt explicitly forbids
 * inventing anything not in that context. If OPENAI_API_KEY isn't
 * configured, this stops and reports that instead of fabricating a reply
 * (no keyword-matched canned text, unlike the older /api/ai-reply route).
 */
export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The AI Assistant isn't configured on the server yet (missing OPENAI_API_KEY)." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const limited = rateLimit(`contact-ai:${ip}`, 15, 10 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many questions. Please try again in a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body?.message || "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message can't be longer than ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
  }

  const { vehicleId, marketplaceListingId, auctionId } = body || {};

  await connectDB();

  let focusedVehicleLine = "";
  if (typeof vehicleId === "string" && mongoose.Types.ObjectId.isValid(vehicleId)) {
    const car = await Car.findById(vehicleId)
      .select("year make model trim price mileage titleStatus status description")
      .lean();
    if (car && (car as any).status !== "archived") {
      focusedVehicleLine = `The customer is currently viewing this dealer vehicle: ${vehicleLine(car)}. Title status: ${(car as any).titleStatus || "unknown"}.`;
    }
  } else if (typeof marketplaceListingId === "string" && mongoose.Types.ObjectId.isValid(marketplaceListingId)) {
    const listing = await MarketplaceListing.findById(marketplaceListingId)
      .select("year make model trim price mileage titleStatus status adminHidden")
      .lean();
    if (listing && (listing as any).status === "live" && !(listing as any).adminHidden) {
      focusedVehicleLine = `The customer is currently viewing this private-seller marketplace listing (not dealer inventory): ${vehicleLine(listing)}. Title status: ${(listing as any).titleStatus || "unknown"}.`;
    }
  } else if (typeof auctionId === "string" && mongoose.Types.ObjectId.isValid(auctionId)) {
    const auction = await AuctionListing.findById(auctionId)
      .select("year make model trim currentBid startingBid mileage titleStatus status adminHidden")
      .lean();
    if (auction && (auction as any).status === "live" && !(auction as any).adminHidden) {
      const a: any = auction;
      focusedVehicleLine = `The customer is currently viewing this private-seller auction (not dealer inventory): ${[a.year, a.make, a.model, a.trim].filter(Boolean).join(" ")} - current bid $${(a.currentBid ?? a.startingBid ?? 0).toLocaleString()} - ${a.mileage ? `${Number(a.mileage).toLocaleString()} miles` : ""}. Title status: ${a.titleStatus || "unknown"}.`;
    }
  }

  const inventory = await Car.find({ status: "available" })
    .select("year make model trim price mileage")
    .sort({ createdAt: -1 })
    .limit(INVENTORY_CONTEXT_LIMIT)
    .lean();
  const inventoryText = inventory.length
    ? inventory.map((c) => `- ${vehicleLine(c)}`).join("\n")
    : "(No dealer vehicles currently marked available.)";

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = `
You are the Contact Center assistant for Drive Prime Motors, a used-car dealership.

STRICT RULES — follow exactly:
- Answer ONLY using the "Dealership facts" and "Current dealer inventory" sections below.
- Never invent or guess: accident history, title status beyond what's given, exact price for a vehicle not listed below, vehicle availability not listed below, financing approval or terms, or legal/DMV advice.
- If the answer isn't in the information given, say you're not sure and suggest the customer use "Send Message" or "Call Drive Prime Motors" to reach a real person — never make something up to sound helpful.
- Keep replies short (2-4 sentences), friendly, and factual. No sales pressure, no urgency tactics.

Dealership facts:
${DEALERSHIP_FAQ}

Current dealer inventory (most recent ${inventory.length}):
${inventoryText}
${focusedVehicleLine ? `\n${focusedVehicleLine}` : ""}
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "The AI Assistant couldn't respond right now." }, { status: 502 });
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("CONTACT AI ERROR:", error);
    return NextResponse.json({ error: "The AI Assistant couldn't respond right now." }, { status: 502 });
  }
}
