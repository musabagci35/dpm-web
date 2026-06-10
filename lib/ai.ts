import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateSalesReply({
  message,
  lead,
  cars,
}: {
  message: string;
  lead: any;
  cars: any[];
}) {
  const carContext = cars
    .slice(0, 3)
    .map(
      (c) =>
        `${c.year} ${c.make} ${c.model} - $${c.price} - ${c.mileage} miles`
    )
    .join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are an elite car salesman at Drive Prime Motors.

GOAL: Close the deal.

Rules:
- 1-2 short sentences
- Always ask a question
- Create urgency
- Push toward visit or phone call
- Offer financing if needed
- Suggest vehicles if relevant

Customer:
Name: ${lead?.name || ""}
Interested: ${lead?.carTitle || "unknown"}

Inventory:
${carContext}
        `,
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return res.choices[0].message.content;
}