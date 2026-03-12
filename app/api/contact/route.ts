import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectDB();

    await Contact.create(body);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Sana bildirim
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "🚗 New Lead - Drive Prime Motors",
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Phone:</strong> ${body.phone}</p>
        <p><strong>Message:</strong> ${body.message}</p>
      `,
    });

    // Müşteriye otomatik cevap
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: body.email,
      subject: "Thank you for contacting Drive Prime Motors",
      html: `
        <h2>Hi ${body.name},</h2>
        <p>Thank you for reaching out to Drive Prime Motors.</p>
        <p>Our team will contact you shortly.</p>
        <br/>
        <p>Drive Prime Motors</p>
      `,
    });

    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error sending email" },
      { status: 500 }
    );
  }
}