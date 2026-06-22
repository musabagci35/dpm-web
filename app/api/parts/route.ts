import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Part from "@/models/Part";

export async function GET() {
  try {
    await connectDB();

    const parts = await Part.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      parts,
    });
  } catch (error) {
    console.error("GET PARTS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}

function makeSku(category: string) {
  const categoryCode = String(category || "other")
    .slice(0, 3)
    .toUpperCase();

  const randomCode = Math.floor(
    100000 + Math.random() * 900000
  );

  return `${categoryCode}-${randomCode}`;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const baseSlug = String(body.title || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
  
  let slug = baseSlug || `part-${Date.now()}`;
  
  let counter = 1;
  while (await Part.findOne({ slug })) {
    slug = `${baseSlug || "part"}-${Date.now()}-${counter}`;
    counter++;
  }

    const sku = body.sku?.trim()
      ? body.sku.trim()
      : makeSku(body.category || "other");

    const created = await Part.create({
      title: body.title,
      slug,
      sku,
      partNumber: body.partNumber || "",
      oemNumber: body.oemNumber || "",
      ebayUrl: body.ebayUrl || "",
      category: body.category || "other",
      condition: body.condition || "used",
      compatibility: body.compatibility || "",
      price: Number(body.price || 0),
      quantity: Number(body.quantity || 1),
      description: body.description || "",
      images: body.images || [],
      isActive: body.isActive ?? true,
    });

    return NextResponse.json(
      {
        success: true,
        part: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE PART ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}