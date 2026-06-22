import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

export async function POST(req: Request) {
  try {
    console.log("🔥 API HIT: sell-your-car");

    const form = await req.json();

    await connectDB();

    await VehicleLead.create({
      name: form.name,
      phone: form.phone,
      email: form.email,
      vin: form.vin,
      year: form.year,
      make: form.make,
      model: form.model,
      mileage: form.mileage,
      price: form.price,
      message: form.message,
      images: form.images || [],
      source: "sell-your-car",
      status: "new",
    });

    console.log("✅ VEHICLE LEAD SAVED");
    console.log("IMAGES:", form.images);

    try {
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
        to: "musabagci35@gmail.com",
        subject: `🚗 New Car Submission – ${form.year} ${form.make} ${form.model}`,

        html: `
          <h2>🚗 New Sell Your Car Lead</h2>

          <p><strong>Name:</strong> ${form.name}</p>
          <p><strong>Phone:</strong> ${form.phone}</p>
          <p><strong>Email:</strong> ${form.email || "N/A"}</p>

          <hr/>

          <p><strong>VIN:</strong> ${form.vin || "N/A"}</p>
          <p><strong>Vehicle:</strong> ${form.year} ${form.make} ${form.model}</p>
          <p><strong>Mileage:</strong> ${form.mileage}</p>
          <p><strong>Asking Price:</strong> ${form.price || "N/A"}</p>

          <p><strong>Message:</strong></p>
          <p>${form.message || ""}</p>

          <hr/>

          <h3>Photos</h3>

          ${
            form.images?.length
              ? form.images
                  .map(
                    (url: string) =>
                      `<p><a href="${url}" target="_blank">${url}</a></p>`
                  )
                  .join("")
              : "<p>No photos uploaded.</p>"
          }
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
    } catch (mailError) {
      console.error("❌ MAIL ERROR BUT LEAD WAS SAVED:", mailError);
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle lead saved",
    });
  } catch (error) {
    console.error("❌ SELL YOUR CAR ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save vehicle lead",
      },
      { status: 500 }
    );
  }
}