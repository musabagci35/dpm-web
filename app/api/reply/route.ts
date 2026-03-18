import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { name, message } = await req.json();

    const prompt = `
You are a professional car salesman for Drive Prime Motors.

Customer name: ${name}
Customer message: ${message}

Your job:
- Reply like a real salesperson
- Be friendly and confident
- Try to move customer toward buying
- Keep it SHORT
- Add urgency
- Mention test drive or appointment

Reply:
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text =
      response.output_text ||
      "Thanks! We’ll contact you shortly.";

    return Response.json({ text });

  } catch (error) {
    console.error("AI ERROR:", error);
    return Response.json({ error: "AI failed" }, { status: 500 });
  }
}