import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const allowed = {
      status: body.status,
      notes: body.notes,
    };

    const lead = await Lead.findByIdAndUpdate(id, allowed, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("PATCH /api/leads/[id] error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
