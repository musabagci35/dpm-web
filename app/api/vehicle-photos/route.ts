import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { make, model } = await req.json();

    if (!make || !model) {
      return NextResponse.json({ error: "Missing vehicle info" }, { status: 400 });
    }

    const base = "https://cdn.imagin.studio/getimage";

    const photos = [
      `${base}?customer=demo&make=${make}&modelFamily=${model}&zoomType=fullscreen`,
      `${base}?customer=demo&make=${make}&modelFamily=${model}&zoomType=studio`,
      `${base}?customer=demo&make=${make}&modelFamily=${model}&zoomType=angle`,
      `${base}?customer=demo&make=${make}&modelFamily=${model}&zoomType=front`,
      `${base}?customer=demo&make=${make}&modelFamily=${model}&zoomType=rear`,
    ];

    return NextResponse.json({ photos });

  } catch (error) {
    return NextResponse.json({ error: "Photo fetch failed" }, { status: 500 });
  }
}