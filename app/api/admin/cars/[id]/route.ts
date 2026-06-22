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
  const update: any = {};

  if ("title" in body) update.title = body.title;
  if ("price" in body) update.price = Number(body.price || 0);
  if ("mileage" in body) update.mileage = Number(body.mileage || 0);
  if ("description" in body) update.description = body.description || "";
  if ("isActive" in body) update.isActive = body.isActive;
  if ("status" in body) update.status = body.status;
  if ("images" in body) update.images = body.images;
  if ("cost" in body) update.cost = Number(body.cost || 0);
  if ("recon" in body) update.recon = Number(body.recon || 0);
  if ("marketing" in body) update.marketing = Number(body.marketing || 0);
  if ("docFee" in body) update.docFee = Number(body.docFee || 0);

  if (update.status === "sold" || update.status === "archived") {
    update.isActive = false;
  }

  const updated = await Car.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    await connectDB();

    const deleted = await Car.findByIdAndUpdate(
      id,
      {
        isActive: false,
        status: "archived",
      },
      { new: true }
    ).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, car: deleted });
  } catch (error) {
    console.error("DELETE CAR ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}