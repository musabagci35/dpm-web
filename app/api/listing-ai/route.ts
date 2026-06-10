import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const year = body.year || "";
    const make = body.make || "";
    const model = body.model || "";
    const mileage = body.mileage || "";
    const price = body.price || "";

    const description = `${year} ${make} ${model} available now at Drive Prime Motors. This vehicle has ${mileage} miles and is listed for $${price}. Contact us today to schedule a test drive or get financing options.`;

    return NextResponse.json({
      success: true,
      title: `${year} ${make} ${model}`,
      description,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}