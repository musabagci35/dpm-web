import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  await connectDB();

  const car: any = await Car.findById(id);

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  const make = (car.make || "").toLowerCase();
  const model = (car.model || "").toLowerCase();
  const year = car.year || "";

  const base = `https://source.unsplash.com/featured/?${year}-${make}-${model}-car`;

  const photos = [
    `${base}&sig=1`,
    `${base}&sig=2`,
    `${base}&sig=3`,
    `${base}&sig=4`,
    `${base}&sig=5`,
    `${base}&sig=6`,
    `${base}&sig=7`,
    `${base}&sig=8`,
    `${base}&sig=9`,
    `${base}&sig=10`,
  ];

  const images = photos.map((url) => ({ url }));

  car.images = images;

  await car.save();

  return NextResponse.json({
    ok: true,
    count: images.length,
    images,
  });
}