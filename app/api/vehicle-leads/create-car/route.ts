import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";
import Car from "@/models/Car";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const lead: any = await VehicleLead.findById(leadId);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const car = await Car.create({
      title: `${lead.year} ${lead.make} ${lead.model}`,
      year: Number(lead.year) || new Date().getFullYear(),
      make: lead.make || "Unknown",
      model: lead.model || "Unknown",
      price: Number(lead.price) || 0,
      mileage: Number(lead.mileage) || 0,
      vin: lead.vin || "",
      description: lead.message || "",
      images: (lead.images || []).map((url: string, index: number) => ({
        url,
        publicId: "",
        isCover: index === 0,
      })),
      status: "available",
      isActive: true,
    });

    lead.status = "converted";
    await lead.save();

    return NextResponse.json({
      success: true,
      carId: car._id,
      slug: car.slug,
    });
  } catch (error) {
    console.error("Create car from lead error:", error);
    return NextResponse.json({ error: "Failed to create car" }, { status: 500 });
  }
}