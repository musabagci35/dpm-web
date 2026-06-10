import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { sendSMS } from "@/lib/sms";
import { NextResponse } from "next/server";

export async function POST() {
  await connectDB();

  const now = new Date();

  // son 3 gün içinde gelen ve hala kapanmamış leadler
  const leads = await Lead.find({
    status: { $nin: ["won", "lost"] },
  });

  let sent = 0;

  for (const lead of leads) {
    if (!lead.phone) continue;

    const last = lead.lastContactedAt || lead.createdAt;
    const diffHours = (now.getTime() - new Date(last).getTime()) / 3600000;

    let message = "";

    if (diffHours > 72) {
      message = `Hey ${lead.name}, just checking in — are you still interested in a vehicle? We have new deals available.`;
    } else if (diffHours > 24) {
      message = `Hi ${lead.name}, wanted to follow up on your inquiry. Let me know if you're still looking!`;
    } else if (diffHours > 0.1) {
      message = `Hi ${lead.name}, thanks for your interest! When is a good time to talk?`;
    }

    if (message) {
      await sendSMS(lead.phone, message);

      lead.lastContactedAt = new Date();
      await lead.save();

      sent++;
    }
  }

  return NextResponse.json({ success: true, sent });
}