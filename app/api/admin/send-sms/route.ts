import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = body.to;
    const message = body.message;

    if (!to || !message) {
      return NextResponse.json(
        { error: "Missing phone or message" },
        { status: 400 }
      );
    }

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE!,
      to,
    });

    return NextResponse.json({
      success: true,
      sid: sms.sid,
    });

  } catch (error) {
    console.error("SEND SMS ERROR:", error);

    return NextResponse.json(
      { success: false, error: "SMS failed" },
      { status: 500 }
    );
  }
}