import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { connectDB } from "@/lib/db";
import Car from "@/models/Car";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();

    const {
      title, price, year, make, model, mileage, description, images
    } = body;

    const car = await Car.create({
      title,
      price,
      year,
      make,
      model,
      mileage,
      description,
      images: images?.map((img: any, i: number) => ({
        url: img.secure_url,
        publicId: img.public_id,
        isCover: i === 0,
      })) || [],
    });

    return NextResponse.json({ success: true, car });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}