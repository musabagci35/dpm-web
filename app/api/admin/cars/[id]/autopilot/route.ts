import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const { id } = await params;

  await connectDB();

  const updated: any = await Car.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json(
      { error: "Updated car not found" },
      { status: 404 }
    );
  }

  /* eBay payload */
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