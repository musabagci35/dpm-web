import { NextResponse } from "next/server";
import OpenAI from "openai";

import { getSellerSession } from "@/lib/sellerSession";
import { getAdminSession } from "@/lib/adminSession";

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Reads a VIN out of a photo (windshield etch, door-jamb sticker, or a
 * title document) via vision OCR. expo-camera only offers barcode scanning
 * natively — no general text recognition — and many VINs are printed as
 * plain text with no barcode at all, so this calls out to a vision-capable
 * model instead of relying on any on-device scanner.
 *
 * Shared by the public Sell flow (seller session) and Admin → Add Vehicle
 * (admin session) — either is accepted, but the route stays gated so an
 * anonymous caller can't run up OpenAI usage.
 *
 * This endpoint only ever returns the 17-character VIN string itself. It
 * never returns or infers mileage, title status, accident, ownership, or
 * odometer information — those aren't in the prompt or the response shape,
 * so there's nothing here that could leak into a vehicle form.
 */
export async function POST(req: Request) {
  const [sellerSession, adminSession] = await Promise.all([
    getSellerSession(),
    getAdminSession(),
  ]);

  if (!sellerSession && !adminSession) {
    return NextResponse.json({ error: "Sign in to scan a VIN." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "VIN scanning is not configured on the server." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const imageBase64: string = String(body?.imageBase64 || "");

  if (!imageBase64) {
    return NextResponse.json({ error: "No photo was provided." }, { status: 400 });
  }

  // Accept either a bare base64 string or a full data URL from the client.
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 20,
      messages: [
        {
          role: "system",
          content:
            "You read Vehicle Identification Numbers (VINs) out of photos. " +
            "A VIN is exactly 17 characters: uppercase letters A-Z and digits 0-9 only, " +
            "never the letters I, O, or Q (they're excluded to avoid confusion with 1 and 0). " +
            "The photo may show a windshield etching, a door-jamb sticker, or a printed title " +
            "document. Reply with ONLY the 17-character VIN, nothing else — no punctuation, " +
            "no explanation. If you cannot find a clear, complete 17-character VIN in the " +
            "image, reply with exactly: NOT_FOUND",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Find and return the VIN in this photo." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const raw = (completion.choices[0]?.message?.content || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!raw || raw === "NOTFOUND" || !VIN_PATTERN.test(raw)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Couldn't read VIN — try again or enter it manually.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, vin: raw });
  } catch (err) {
    console.error("VIN SCAN ERROR:", err);
    return NextResponse.json(
      { error: "VIN scan failed. Please try again or enter the VIN manually." },
      { status: 500 }
    );
  }
}
