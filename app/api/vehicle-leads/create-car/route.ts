import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";
import Car from "@/models/Car";

function makeSlug(lead: any) {
  const base = `${lead.year || ""}-${lead.make || ""}-${lead.model || ""}-${lead.vin || Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return base || `vehicle-${Date.now()}`;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Missing leadId" },
        { status: 400 }
      );
    }

    const lead: any = await VehicleLead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const baseSlug = makeSlug(lead);
    let finalSlug = baseSlug;
    let count = 1;

    while (await Car.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${Date.now()}-${count}`;
      count++;
    }

    const cleanImages = Array.isArray(lead.images)
      ? lead.images
          .map((img: any, index: number) => {
            const url = typeof img === "string" ? img : img?.url;
            if (!url) return null;

            return {
              url,
              publicId: typeof img === "object" ? img.publicId || "" : "",
              isCover: index === 0,
            };
          })
          .filter(Boolean)
      : [];

    const title =
      `${lead.year || ""} ${lead.make || ""} ${lead.model || ""}`.trim() ||
      "Inventory Vehicle";

    const car = await Car.create({
      title,
      slug: finalSlug,
      year: Number(lead.year) || new Date().getFullYear(),
      make: lead.make || "Unknown",
      model: lead.model || "Unknown",
      price: Number(lead.price) || 0,
      mileage: Number(lead.mileage) || 0,
      vin: lead.vin || "",
      description: lead.message || "",
      images: cleanImages,
      status: "available",
      isActive: true,
      isFeatured: false,
    });

    lead.status = "converted";
    await lead.save();

    return NextResponse.json({
      success: true,
      carId: car._id.toString(),
      slug: car.slug,
    });
  } catch (error: any) {
    console.error("Create car from lead error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create car",
      },
      { status: 500 }
    );
  }
}
