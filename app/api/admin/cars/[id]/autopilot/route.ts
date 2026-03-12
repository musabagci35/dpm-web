import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;

  await connectDB();

  const car = await Car.findById(id).lean();

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  /* Website publish */
  const updated = await Car.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).lean();

  /* eBay payload (stub – gerçek API için token gerekir) */
  const ebayPayload = {
    sku: id,
    title: updated.title,
    price: updated.price,
    description: updated.description,
  };

  /* Craigslist export */
  const craigslist = {
    title: updated.title,
    price: updated.price,
    description: updated.description,
    images: updated.images || [],
  };

  return NextResponse.json({
    ok: true,
    website: "published",
    ebay: ebayPayload,
    craigslist,
  });
}