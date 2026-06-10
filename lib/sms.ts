import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendSMS(to: string, message: string) {
  try {
    const res = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE!,
      to,
    });

    return res;
  } catch (error) {
    console.error("SMS error:", error);
    throw error;
  }
}