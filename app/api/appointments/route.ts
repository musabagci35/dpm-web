import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Lead from "@/models/Lead";

const appointmentSchema = z.object({
  carId: z.string().optional(),
  carTitle: z.string().optional().default(""),
  customerName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  appointmentDate: z.string().min(1),
  notes: z.string().optional().default(""),
});

export async function GET() {
  try {
    await connectDB();

    const appointments = await Appointment.find()
      .sort({ appointmentDate: 1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("GET APPOINTMENTS ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = appointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid appointment data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const data = parsed.data;

    const appointment = await Appointment.create({
      carId: data.carId || null,
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || "",
      appointmentDate: new Date(data.appointmentDate),
      notes: data.notes,
      status: "scheduled",
    });

    await Lead.create({
      dealerId: "64f000000000000000000001",
      carId: data.carId || null,
      carTitle: data.carTitle || "",
      name: data.customerName,
      phone: data.phone,
      email: data.email || "",
      message: `Test drive appointment requested for ${new Date(
        data.appointmentDate
      ).toLocaleString()}. ${data.notes || ""}`,
      source: "inventory",
      status: "appointment",
      priority: "hot",
      followUpDate: new Date(data.appointmentDate),
    });

    return NextResponse.json(
      { success: true, appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE APPOINTMENT ERROR:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}