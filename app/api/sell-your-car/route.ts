import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    console.log("🔥 API HIT: sell-your-car");

    const form = await req.json();

    console.log("📤 TRYING TO SEND MAIL");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS EXISTS:", !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Drive Prime Motors" <${process.env.EMAIL_USER}>`,
      to: "musabagci35@gmail.com", // TEST İÇİN DEĞİŞTİRDİK
      subject: `🚗 New Car Submission – ${form.year} ${form.make} ${form.model}`,

      html: `
        <h2>Drive Prime Motors</h2>
        <p><strong>Name:</strong> ${form.name}</p>
        <p><strong>Phone:</strong> ${form.phone}</p>
        <p><strong>Email:</strong> ${form.email}</p>
        <hr/>
        <p><strong>Vehicle:</strong> ${form.year} ${form.make} ${form.model}</p>
        <p><strong>Mileage:</strong> ${form.mileage}</p>
        <p>${form.message || ""}</p>
      `,

      text: `
New Sell Your Car Submission

Name: ${form.name}
Phone: ${form.phone}
Email: ${form.email}

Vehicle:
${form.year} ${form.make} ${form.model}
Mileage: ${form.mileage}

Message:
${form.message}
      `,
    });

    console.log("✅ MAIL SENT SUCCESSFULLY");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ MAIL ERROR:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
