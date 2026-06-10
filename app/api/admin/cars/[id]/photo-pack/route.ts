import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Ctx = {
  params: Promise<{ id: string }>;
};

export async function POST(
  req: Request,
  ctx: Ctx
) {
  const { id } = await ctx.params;

  await connectDB();

  const car: any =
    await Car.findById(id);

  if (!car) {
    return NextResponse.json(
      { error: "Car not found" },
      { status: 404 }
    );
  }

  // 🔥 SIMPLE PLACEHOLDER IMAGES
  const images = [
    { url: "/car-placeholder.jpg" },
    { url: "/car-placeholder.jpg" },
    { url: "/car-placeholder.jpg" },
    { url: "/car-placeholder.jpg" },
    { url: "/car-placeholder.jpg" },
  ];

  car.images = images;

  await car.save();

  return NextResponse.json({
    ok: true,
    count: images.length,
    images,
  });
}