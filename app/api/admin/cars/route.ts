import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function makeSlug(data: any) {
  return `${data.year || ""}-${data.make || ""}-${data.model || ""}-${data.vin || Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
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
      mileage: Number(body.mileage || 0),
      description: body.description || "",
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