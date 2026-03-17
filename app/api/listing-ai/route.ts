import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { car } = await req.json();

    const base = `${car.year} ${car.make} ${car.model}
Price: $${car.price}
Mileage: ${car.mileage}`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
Create 3 different car listings:

1. Facebook Marketplace → short, catchy, emojis
2. Craigslist → longer, SEO, detailed
3. OfferUp → casual, simple

Car:
${base}

Return JSON like:
{
  "facebook": "...",
  "craigslist": "...",
  "offerup": "..."
}
`,
    });

    const raw =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text;

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback
      parsed = {
        facebook: `🔥 ${base}\nCall now!`,
        craigslist: `${base}\nClean title. Great condition.`,
        offerup: `${base}\nRuns good!`,
      };
    }

    return Response.json(parsed);

  } catch (e) {
    return Response.json({
      facebook: "Great car for sale!",
      craigslist: "Reliable vehicle ready to drive.",
      offerup: "Runs good, message me.",
    });
  }
}