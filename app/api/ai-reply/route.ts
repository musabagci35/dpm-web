import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name || "Customer";
    const message = (body.message || "").toLowerCase();

    let text =
      `Hi ${name}, thanks for contacting Drive Prime Motors. ` +
      `A team member will contact you shortly.`;

    // 🔥 SMART RESPONSES
    if (message.includes("price")) {
      text =
        `Hi ${name}, thanks for asking about pricing. ` +
        `We’ll send you the best available price and financing options shortly.`;
    }

    if (
      message.includes("finance") ||
      message.includes("financing")
    ) {
      text =
        `Hi ${name}, we work with all credit types and financing options. ` +
        `Our team will contact you soon to help you get approved.`;
    }

    if (
      message.includes("available") ||
      message.includes("still available")
    ) {
      text =
        `Hi ${name}, thanks for your interest. ` +
        `We’ll confirm vehicle availability shortly.`;
    }

    return NextResponse.json({
      success: true,
      text,
    });

  } catch (error) {
    console.error("AI REPLY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        text: "Thanks for contacting us!",
      },
      { status: 500 }
    );
  }
}