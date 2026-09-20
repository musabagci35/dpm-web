import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { getAdminSession } from "@/lib/adminSession";

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
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["available", "pending", "sold", "archived"]).optional(),
  bodyClass: z.string().optional(),
  engine: z.string().optional(),
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  fuelType: z.string().optional(),
  titleStatus: z
    .enum(["clean", "salvage", "rebuilt", "title_pending", "parts_only", "unknown"])
    .optional(),
  carfaxUrl: z.string().optional(),
  vehicleHistoryReport: z
    .object({
      url: z.string().optional().default(""),
      source: z.enum(["carfax", "seller_provided", "other"]).optional().default("other"),
      reportDate: z.string().optional(),
      approved: z.boolean().optional(),
    })
    .optional(),
  images: z.array(imageSchema).optional(),
  cost: z.coerce.number().min(0).optional(),
  recon: z.coerce.number().min(0).optional(),
  marketing: z.coerce.number().min(0).optional(),
  docFee: z.coerce.number().min(0).optional(),
});

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Admin has full control over a Car's report — it's dealer inventory,
    // never seller-submitted, so every report here is admin-verified.
    if (data.vehicleHistoryReport) {
      const report = data.vehicleHistoryReport;
      data.vehicleHistoryReport = {
        url: report.url || "",
        source: report.source || "other",
        reportDate: report.reportDate ? new Date(report.reportDate) : null,
        sellerProvided: false,
        approved: report.url ? report.approved !== false : true,
      };
    }

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
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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