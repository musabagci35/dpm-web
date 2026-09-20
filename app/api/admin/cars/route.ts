import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { getAdminSession } from "@/lib/adminSession";

const ADMIN_LIST_FIELDS =
  "title slug year make model trim price mileage vin phone status isActive isFeatured images createdAt updatedAt";

const STATUS_TABS = ["available", "pending", "sold", "archived"];

function makeSlug(data: any) {
  return `${data.year || ""}-${data.make || ""}-${data.model || ""}-${data.vin || Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";

    const query: any =
      status && STATUS_TABS.includes(status) ? { status } : {};

    const cars = await Car.find(query)
      .select(ADMIN_LIST_FIELDS)
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: cars.length,
      vehicles: cars.map((car: any) => ({ ...car, _id: car._id.toString() })),
    });
  } catch (error) {
    console.error("LIST ADMIN CARS ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    const images = Array.isArray(body.images)
      ? body.images
          .filter((img: any) => img?.url)
          .map((img: any, i: number) => ({
            url: img.url,
            publicId: img.publicId || "",
            isCover: Boolean(img.isCover) || i === 0,
          }))
      : [];

    const status = body.status || "available";

    // Admin has full control over a Car's report — it's dealer inventory,
    // never seller-submitted, so every report set here is admin-verified.
    const reportInput = body.vehicleHistoryReport || {};
    const vehicleHistoryReport = reportInput.url
      ? {
          url: String(reportInput.url || ""),
          source: ["carfax", "seller_provided", "other"].includes(reportInput.source)
            ? reportInput.source
            : "other",
          reportDate: reportInput.reportDate ? new Date(reportInput.reportDate) : null,
          sellerProvided: false,
          approved: reportInput.approved !== false,
        }
      : undefined;

    const baseSlug = makeSlug(body);
    let finalSlug = baseSlug;
    let count = 1;

    while (await Car.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${Date.now()}-${count}`;
      count++;
    }

    const car = await Car.create({
      title: body.title,
      vin: body.vin || "",
      price: Number(body.price || 0),
      year: Number(body.year || 0),
      make: body.make,
      model: body.model,
      trim: body.trim || "",
      bodyClass: body.bodyClass || "",
      engine: body.engine || "",
      transmission: body.transmission || "",
      drivetrain: body.drivetrain || "",
      fuelType: body.fuelType || "",
      mileage: Number(body.mileage || 0),
      titleStatus: body.titleStatus || "unknown",
      description: body.description || "",
      videoUrl: body.videoUrl || "",
      phone: body.phone || "",
      carfaxUrl: body.carfaxUrl || "",
      ...(vehicleHistoryReport ? { vehicleHistoryReport } : {}),
      images,
      status,
      isActive: status === "sold" || status === "archived" ? false : true,
      isFeatured: Boolean(body.isFeatured),
      slug: finalSlug,
    });

    return NextResponse.json({ success: true, car }, { status: 201 });
  } catch (err) {
    console.error("CREATE CAR ERROR:", err);

    return NextResponse.json(
      { success: false, error: "Failed to create car" },
      { status: 500 }
    );
  }
}