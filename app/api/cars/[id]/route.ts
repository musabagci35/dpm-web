import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { requireAdmin } from "@/lib/requireAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().default(""),
  isCover: z.boolean().optional().default(false),
});

const updateSchema = z.object({
  title: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  mileage: z.coerce.number().min(0).optional(),
  vin: z.string().trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["available", "pending", "sold", "archived"]).optional(),
  images: z.array(imageSchema).optional(),
  cost: z.coerce.number().min(0).optional(),
  recon: z.coerce.number().min(0).optional(),
  marketing: z.coerce.number().min(0).optional(),
  docFee: z.coerce.number().min(0).optional(),
});

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
    }

    await connectDB();

    const car = await Car.findById(id).lean();

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(car);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
    }

    await connectDB();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: any = parsed.data;

    if (data.status === "sold" || data.status === "archived") {
      data.isActive = false;
    }

    if (data.status === "available" || data.status === "pending") {
      data.isActive = true;
    }

    const updated = await Car.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE CAR ERROR:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
    }

    await connectDB();

    const deleted = await Car.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}