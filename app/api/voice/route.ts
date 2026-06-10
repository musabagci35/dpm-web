import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const twiml = `
    <Response>
      <Say voice="alice">
        Hello, thanks for calling Drive Prime Motors.
        How can I help you today?
      </Say>

      <Gather input="speech" action="/api/voice/handle" method="POST">
        <Say>Please tell me what you are looking for.</Say>
      </Gather>

      <Say>We did not receive input. Goodbye.</Say>
    </Response>
  `;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}