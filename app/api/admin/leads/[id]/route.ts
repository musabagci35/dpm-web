import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    await connectDB();

    const body = await req.json();

    const updated = await Lead.findByIdAndUpdate(
      id,
      {
        status: body.status,
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lead update failed" },
      { status: 500 }
    );
  }
}