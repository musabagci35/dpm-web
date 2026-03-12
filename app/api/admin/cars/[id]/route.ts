import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  await connectDB();

  const car = await Car.findById(id).lean();

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json(car);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;

  await connectDB();

  const body = await req.json();

  const updated = await Car.findByIdAndUpdate(
    id,
    {
      title: body.title,
      price: Number(body.price || 0),
      mileage: Number(body.mileage || 0),
      description: body.description || "",
      isActive: !!body.isActive,
      images: body.images || [],
      cost: Number(body.cost || 0),
      recon: Number(body.recon || 0),
      marketing: Number(body.marketing || 0),
      docFee: Number(body.docFee || 0),
    },
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  await connectDB();

  const deleted = await Car.findByIdAndDelete(id).lean();

  if (!deleted) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}