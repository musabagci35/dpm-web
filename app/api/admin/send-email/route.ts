import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = body.to;
    const subject =
      body.subject || "Drive Prime Motors";

    const message = body.message;

    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing email or message",
        },
        { status: 400 }
      );
    }

    // 🔥 CHECK ENV
    if (
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Email config missing",
        },
        { status: 500 }
      );
    }

    // 🔥 TRANSPORT
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 🔥 SEND
    await transporter.sendMail({
      from: `"Drive Prime Motors" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Drive Prime Motors</h2>

          <p>${message.replace(/\n/g, "<br />")}</p>

          <hr />

          <p style="font-size:12px;color:#666">
            Drive Prime Motors<br/>
            Sacramento, California
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error(
      "SEND EMAIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Email failed",
      },
      { status: 500 }
    );
  }
}