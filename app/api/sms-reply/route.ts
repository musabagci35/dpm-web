import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";
import OpenAI from "openai";
import Twilio from "twilio";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = Twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_AUTH!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const message = formData.get("Body") as string;
    const from = formData.get("From") as string;

    await connectDB();

    // 🔥 lead bul (phone ile)
    const lead = await Lead.findOne({ phone: from });

    if (!lead) {
      return new Response("OK");
    }

    // 🔥 AI SALES BRAIN
    const ai = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a top car salesman for Drive Prime Motors.

Customer: ${lead.name}
Conversation:
Customer: ${message}

Your goals:
- Keep conversation going
- Build trust
- Push test drive
- Push urgency
- Be short and human

Close the deal.

Reply:
`,
    });

    const reply =
      ai.output_text ||
      "Sounds good! When can you come check it out?";

    // 🔥 SMS gönder
    await client.messages.create({
      body: reply,
      from: process.env.TWILIO_PHONE!,
      to: from,
    });

    return new Response("OK");

  } catch (err) {
    console.error("SMS REPLY ERROR:", err);
    return new Response("Error", { status: 500 });
  }
}