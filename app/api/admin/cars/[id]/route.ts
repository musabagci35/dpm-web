import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { getAdminSession } from "@/lib/adminSession";

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
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectDB();

  const body = await req.json();
  const update: any = {};

  if ("title" in body) update.title = body.title;
  if ("price" in body) update.price = Number(body.price || 0);
  if ("year" in body) update.year = Number(body.year || 0);
  if ("make" in body) update.make = body.make || "";
  if ("model" in body) update.model = body.model || "";
  if ("trim" in body) update.trim = body.trim || "";
  if ("bodyClass" in body) update.bodyClass = body.bodyClass || "";
  if ("engine" in body) update.engine = body.engine || "";
  if ("transmission" in body) update.transmission = body.transmission || "";
  if ("drivetrain" in body) update.drivetrain = body.drivetrain || "";
  if ("fuelType" in body) update.fuelType = body.fuelType || "";
  if ("mileage" in body) update.mileage = Number(body.mileage || 0);
  if ("titleStatus" in body) update.titleStatus = body.titleStatus || "unknown";
  if ("description" in body) update.description = body.description || "";
  if ("videoUrl" in body) update.videoUrl = body.videoUrl || "";
  if ("phone" in body) update.phone = body.phone || "";
  if ("carfaxUrl" in body) update.carfaxUrl = body.carfaxUrl || "";
  if ("vehicleHistoryReport" in body) {
    // Admin has full control over a Car's report — it's dealer inventory,
    // never seller-submitted, so every report here is admin-verified.
    const report = body.vehicleHistoryReport || {};
    update.vehicleHistoryReport = {
      url: String(report.url || ""),
      source: ["carfax", "seller_provided", "other"].includes(report.source) ? report.source : "other",
      reportDate: report.reportDate ? new Date(report.reportDate) : null,
      sellerProvided: false,
      approved: report.url ? report.approved !== false : true,
    };
  }
  if ("isActive" in body) update.isActive = body.isActive;
  if ("status" in body) update.status = body.status;
  if ("isFeatured" in body) update.isFeatured = Boolean(body.isFeatured);
  if ("images" in body) update.images = body.images;
  if ("cost" in body) update.cost = Number(body.cost || 0);
  if ("recon" in body) update.recon = Number(body.recon || 0);
  if ("docFee" in body) update.docFee = Number(body.docFee || 0);

  if (
    "marketing" in body &&
    body.marketing &&
    typeof body.marketing === "object" &&
    !Array.isArray(body.marketing)
  ) {
    update.marketing = body.marketing;
  }

  if (update.status === "sold" || update.status === "archived") {
    update.isActive = false;
  } else if (update.status === "available" || update.status === "pending") {
    update.isActive = true;
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
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const deleted = await Car.findByIdAndDelete(id).lean();

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