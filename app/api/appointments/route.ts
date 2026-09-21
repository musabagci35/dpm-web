import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import Lead from "@/models/Lead";
import { getAdminSession } from "@/lib/adminSession";
import { sendMail } from "@/lib/mail";
import { sendSMS } from "@/lib/sms";
import { isSmsConfigured } from "@/lib/smsOtp";
import { rateLimit } from "@/lib/rateLimit";

const appointmentSchema = z.object({
  carId: z.string().optional(),
  carTitle: z.string().optional().default(""),
  customerName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  appointmentDate: z.string().min(1),
  notes: z.string().optional().default(""),
});

const DEALER_PHONE_DISPLAY = "(916) 261-8880";

/** Never logs a full phone number — last 4 digits only, same spirit as masking a card number. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `***-***-${digits.slice(-4)}` : "***";
}

/** Twilio requires E.164 — same "assume US, prefix +1" convention already used for lead notifications. */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return phone.trim().startsWith("+") ? phone.trim() : `+1${digits}`;
}

function formatAppointmentDatePT(date: Date): string {
  return (
    date.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " Pacific Time"
  );
}

/**
 * Immediate "we got your request" notice — never "confirmed", since no one
 * has reviewed or approved the time yet; the dealership still has to call
 * back to lock in the actual appointment. Reuses the same Gmail-via-
 * nodemailer (lib/mail.ts) and Twilio (lib/sms.ts) helpers already wired up
 * for lead notifications and auth email/SMS — no second email/SMS system.
 * Fire-and-forget from the caller: a failure here is logged (without any
 * sensitive data) and never rolls back or blocks the appointment response.
 */
async function sendAppointmentConfirmation(input: {
  customerName: string;
  phone: string;
  email: string;
  carTitle: string;
  appointmentDate: Date;
}): Promise<void> {
  const { customerName, phone, email, carTitle, appointmentDate } = input;

  // A rapid resubmit of the exact same request (double-tap, network retry)
  // must not send two confirmations — keyed on phone + the exact requested
  // instant, so a genuinely different appointment from the same customer
  // minutes later still sends its own. In-memory, same pattern already
  // used for login/OTP rate limiting elsewhere in this codebase; no new
  // schema needed for this.
  const dedupeKey = `appointment-confirm:${phone}:${appointmentDate.toISOString()}`;
  if (!rateLimit(dedupeKey, 1, 5 * 60 * 1000).success) return;

  const whenLabel = formatAppointmentDatePT(appointmentDate);
  const vehicleLine = carTitle ? ` for the ${carTitle}` : "";

  if (email) {
    try {
      await sendMail({
        to: email,
        subject: "Appointment request received — Drive Prime Motors",
        html: `
          <h2>Appointment Request Received</h2>
          <p>Hi ${customerName},</p>
          <p>Thanks for requesting an appointment with Drive Prime Motors${vehicleLine}.</p>
          <p><b>Requested date/time:</b> ${whenLabel}</p>
          ${carTitle ? `<p><b>Vehicle:</b> ${carTitle}</p>` : ""}
          <p>This isn't confirmed yet — our team will contact you to confirm the final appointment time.</p>
          <p>
            Drive Prime Motors<br />
            Rancho Cordova, CA<br />
            Phone: ${DEALER_PHONE_DISPLAY}
          </p>
        `,
      });
    } catch (err) {
      console.error("APPOINTMENT CONFIRMATION EMAIL FAILED:", err instanceof Error ? err.message : err);
    }
  }

  if (phone && isSmsConfigured()) {
    try {
      const vehicleSuffix = carTitle ? ` (${carTitle})` : "";
      await sendSMS(
        toE164(phone),
        `Drive Prime Motors: Appointment request received for ${whenLabel}${vehicleSuffix}. ` +
          `We'll call to confirm. Questions? ${DEALER_PHONE_DISPLAY}. Rancho Cordova, CA. Reply STOP to opt out.`
      );
    } catch (err) {
      console.error("APPOINTMENT CONFIRMATION SMS FAILED:", err instanceof Error ? err.message : err, maskPhone(phone));
    }
  }
}

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      appointmentAt: new Date(data.appointmentDate),
    });

    // Both writes already succeeded above — a messaging failure past this
    // point must never roll back the appointment or change the response.
    void sendAppointmentConfirmation({
      customerName: data.customerName,
      phone: data.phone,
      email: data.email || "",
      carTitle: data.carTitle || "",
      appointmentDate: new Date(data.appointmentDate),
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