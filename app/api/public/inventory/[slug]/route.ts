import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

const PUBLIC_FIELDS =
  "slug year make model trim price mileage status isActive images description";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    const car: any = await Car.findOne({ slug }).select(PUBLIC_FIELDS).lean();

    if (!car) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    const isSold = car.status === "sold";

    if (car.status === "archived" || (car.isActive === false && !isSold)) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      );
    }

    const { isActive, ...publicCar } = car;

    return NextResponse.json({
      success: true,
      vehicle: { ...publicCar, _id: car._id.toString() },
    });
  } catch (error) {
    console.error("PUBLIC VEHICLE DETAIL ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
