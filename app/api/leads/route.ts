import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import nodemailer from "nodemailer";
import Twilio from "twilio";

async function generateAIReply(lead: any) {
  const res = await fetch(
    `${process.env.BASE_URL}/api/ai-reply`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: lead.name,
        message: lead.message,
      }),
    }
  );
  async function autoReplySMS(lead: any) {
    const aiMessage = await generateAIReply(lead);
  
    await twilioClient.messages.create({
      body: aiMessage,
      from: process.env.TWILIO_PHONE,
      to: lead.phone,
    });
  }
  const data = await res.json();
  return data.text;
}

// 🔥 TWILIO
const twilioClient = Twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_AUTH!
);

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
    subject: "🚀 New Lead",
    html: `
      <h2>New Lead</h2>
      <p><b>Name:</b> ${lead.name}</p>
      <p><b>Phone:</b> ${lead.phone}</p>
      <p><b>Email:</b> ${lead.email}</p>
      <p><b>Message:</b> ${lead.message}</p>
      <p><b>Source:</b> ${lead.source}</p>
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

// 🔥 SMS (ADMIN)
async function sendSMS(lead: any) {
  if (!process.env.TWILIO_PHONE) return;

  await twilioClient.messages.create({
    body: `🚗 New Lead: ${lead.name} ${lead.phone}`,
    from: process.env.TWILIO_PHONE,
    to: process.env.MY_PHONE!,
  });
}

// 🔥 SMS (CUSTOMER)
async function autoReplySMS(lead: any) {
  if (!process.env.TWILIO_PHONE) return;

  await twilioClient.messages.create({
    body: `Hi ${lead.name}, thanks for contacting Drive Prime Motors. We'll call you shortly.`,
    from: process.env.TWILIO_PHONE,
    to: lead.phone,
  });
}

// ✅ GET
export async function GET() {
  try {
    await connectDB();
    const leads = await Lead.find().sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch (error) {
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

    const dealerId = "64f000000000000000000001";

    const lead = await Lead.create({
      dealerId,
      carId: body.carId || null,
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      message: body.message || "",
      source: body.source || "website",
      status: "new",
    });

    // 🔥 AUTOMATION (ALL)
    try {
      await sendEmail(lead);
      await autoReplyEmail(lead);
      await sendSMS(lead);
      await autoReplySMS(lead);
    } catch (e) {
      console.log("Automation error (skip):", e);
    }

    return NextResponse.json(lead, { status: 201 });

  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}