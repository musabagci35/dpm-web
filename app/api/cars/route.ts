import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/requireAdmin";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().default(""),
  isCover: z.boolean().optional().default(false),
});

const carSchema = z.object({
  title: z.string().min(3).max(120),
  year: z.coerce.number().int().min(1900).max(2100),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional().default(""),
  price: z.coerce.number().min(0),
  mileage: z.coerce.number().min(0),
  vin: z.string().trim().optional().default(""),
  description: z.string().optional().default(""),
  images: z.array(imageSchema).optional().default([]),
  status: z
    .enum(["available", "pending", "sold", "archived"])
    .optional()
    .default("available"),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const parsed = carSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const data = parsed.data;

    if (data.status === "sold" || data.status === "archived") {
      data.isActive = false;
    }

    const slug = `${data.year}-${data.make}-${data.model}-${data.vin || ""}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const existingCar = await Car.findOne({ slug });

    if (existingCar) {
      return NextResponse.json(
        {
          success: false,
          error: "This vehicle already exists",
        },
        { status: 409 }
      );
    }

    const created = await Car.create({
      ...data,
      slug,
    });

    return NextResponse.json(
      { success: true, car: created },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE CAR ERROR:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}