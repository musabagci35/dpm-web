import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { title, price, description, image } = await req.json()

    const PAGE_TOKEN = process.env.FB_PAGE_TOKEN
    const PAGE_ID = process.env.FB_PAGE_ID

    if (!PAGE_TOKEN || !PAGE_ID) {
      return NextResponse.json({ error: "Facebook token missing" }, { status: 500 })
    }

    const caption = `
🚗 ${title}

${description}

💰 Price: $${price}

📍 Drive Prime Motors
Rancho Cordova, CA
`

    const fbRes = await fetch(
      `https://graph.facebook.com/v18.0/${PAGE_ID}/photos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: image,
          caption,
          access_token: PAGE_TOKEN,
        }),
      }
    )

    const data = await fbRes.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Facebook post failed" }, { status: 500 })
  }
}