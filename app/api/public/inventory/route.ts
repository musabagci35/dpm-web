import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PUBLIC_FIELDS =
  "slug year make model trim price mileage status images description";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";
    const price = searchParams.get("price") || "";
    const year = searchParams.get("year") || "";
    const mileage = searchParams.get("mileage") || "";
    const sort = searchParams.get("sort") || "";

    const query: any = {
      isActive: true,
      status: { $nin: ["sold", "archived"] },
    };

    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { make: { $regex: safe, $options: "i" } },
        { model: { $regex: safe, $options: "i" } },
        { trim: { $regex: safe, $options: "i" } },
        { vin: { $regex: safe, $options: "i" } },
      ];
    }

    if (make) query.make = { $regex: escapeRegex(make), $options: "i" };
    if (model) query.model = { $regex: escapeRegex(model), $options: "i" };

    if (price && !isNaN(Number(price)) && Number(price) > 0) {
      query.price = { $lte: Number(price) };
    }

    if (year && !isNaN(Number(year))) {
      query.year = { $gte: Number(year) };
    }

    if (mileage && !isNaN(Number(mileage))) {
      query.mileage = { $lte: Number(mileage) };
    }

    let sortOption: any = { isFeatured: -1, createdAt: -1 };
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "mileage") sortOption = { mileage: 1 };

    const cars = await Car.find(query)
      .select(PUBLIC_FIELDS)
      .sort(sortOption)
      .lean();

    return NextResponse.json({
      success: true,
      count: cars.length,
      vehicles: cars.map((car: any) => ({ ...car, _id: car._id.toString() })),
    });
  } catch (error) {
    console.error("PUBLIC INVENTORY ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
