import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import nodemailer from "nodemailer";
import { getAdminSession } from "@/lib/adminSession";

// 🔥 BASE URL
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 🔥 HTML ESCAPE (lead values are customer-supplied and land in an email body)
const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 🔥 CAR ID GUARD
// Lead.carId is an ObjectId ref — a non-id string (or an empty one) would make
// Lead.create throw, so anything that isn't a real id is stored as null.
const isValidObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{24}$/i.test(value);

// 🔥 PHONE FORMAT
const formatPhone = (phone: string) => {
  if (!phone.startsWith("+1")) {
    return "+1" + phone.replace(/\D/g, "");
  }
  return phone;
};

// 🔥 AI REPLY
async function generateAIReply(lead: any) {
  try {
    const res = await fetch(`${baseUrl}/api/ai-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: lead.name,
        message: lead.message,
      }),
    });

    const data = await res.json();
    return data.text || "Thanks for contacting us!";
  } catch {
    return "Thanks for contacting us!";
  }
}

// 🔥 EMAIL (ADMIN)
async function sendEmail(lead: any) {
  if (!process.env.EMAIL_USER) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Drive Prime Motors" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: lead.vin ? "🚀 New Vehicle Request (VIN)" : "🚀 New Lead",
    html: `
      <h2>New Lead</h2>
      <p><b>Name:</b> ${escapeHtml(lead.name)}</p>
      <p><b>Phone:</b> ${escapeHtml(lead.phone)}</p>
      <p><b>Email:</b> ${escapeHtml(lead.email)}</p>
      ${lead.carTitle ? `<p><b>Vehicle:</b> ${escapeHtml(lead.carTitle)}</p>` : ""}
      ${lead.vin ? `<p><b>VIN:</b> ${escapeHtml(lead.vin)}</p>` : ""}
      <p><b>Source:</b> ${escapeHtml(lead.source)}</p>
      <p><b>Message:</b> ${escapeHtml(lead.message)}</p>
    `,
  });
}

// 🔥 EMAIL (CUSTOMER)
async function autoReplyEmail(lead: any) {
  if (!lead.email || !process.env.EMAIL_USER) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Drive Prime Motors" <${process.env.EMAIL_USER}>`,
    to: lead.email,
    subject: "Thanks for contacting us 🚗",
    html: `
      <h2>Hi ${lead.name},</h2>
      <p>Thanks for contacting Drive Prime Motors.</p>
      <p>We will call you shortly.</p>
    `,
  });
}

// 🔥 TWILIO HELPER (CRITICAL FIX)
async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !accountSid.startsWith("AC") || !authToken) {
    return null;
  }

  const twilio = await import("twilio");
  return twilio.default(accountSid, authToken);
}

// 🔥 SMS (ADMIN)
async function sendSMS(lead: any) {
  const client = await getTwilioClient();
  if (!client || !process.env.TWILIO_PHONE || !process.env.MY_PHONE) return;

  await client.messages.create({
    body: `🚗 New Lead: ${lead.name} ${lead.phone}`,
    from: process.env.TWILIO_PHONE,
    to: process.env.MY_PHONE,
  });
}

// 🔥 SMS (CUSTOMER - AI)
async function autoReplySMS(lead: any) {
  const client = await getTwilioClient();
  if (!client || !process.env.TWILIO_PHONE) return;

  const aiMessage = await generateAIReply(lead);

  await client.messages.create({
    body: aiMessage,
    from: process.env.TWILIO_PHONE,
    to: formatPhone(lead.phone),
  });
}

// ✅ GET
export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const leads = await Lead.find().sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ✅ POST
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: "Name and phone required" },
        { status: 400 }
      );
    }

    await connectDB();

    // A "Request This Vehicle" lead comes from a decoded VIN that isn't in
    // inventory, so there is no carId to attach — the VIN and the decoded
    // title are what tell the dealer which vehicle the customer wants.
    const vin = String(body.vin || "").trim().toUpperCase();
    const isVinRequest = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
    const allowedSources = ["website", "inventory", "vin", "facebook", "walkin"];
    const requestedSource = String(body.source || "");
    const source = allowedSources.includes(requestedSource)
      ? requestedSource
      : isVinRequest
      ? "vin"
      : "website";

    const lead = await Lead.create({
      dealerId: "64f000000000000000000001",
      carId: isValidObjectId(body.carId) ? body.carId : null,
      vin: isVinRequest ? vin : "",
      carTitle: String(body.carTitle || "").trim(),
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      message: body.message || "",
      source,
      status: "new",
    });

    // 🔥 NON-BLOCKING
    void Promise.allSettled([
      sendEmail(lead),
      autoReplyEmail(lead),
      sendSMS(lead),
      autoReplySMS(lead),
    ]);

    return NextResponse.json(lead, { status: 201 });

  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}