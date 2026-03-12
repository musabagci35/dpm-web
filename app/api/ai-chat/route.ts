import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const body = await req.json();

  const message = body.message;
  const carTitle = body.carTitle;

  let reply = "";

  const msg = message.toLowerCase();

  if (msg.includes("available")) {
    reply =
      `Yes, the ${carTitle} is available at Drive Prime Motors. 
Would you like to schedule a test drive or get financing?`;
  }

  else if (msg.includes("price")) {
    reply =
      `You can see the latest price listed on this page. 
We also offer financing options.`;
  }

  else if (msg.includes("finance")) {
    reply =
      `Yes, we offer financing for most credit types. 
You can apply here: /financing`;
  }

  else {
    reply =
      `Thanks for contacting Drive Prime Motors. 
Would you like to schedule a test drive or get more information about this vehicle?`;
  }

  return NextResponse.json({ reply });

}