import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateSchema = z.object({
  status: z
    .enum([
      "new",
      "contacted",
      "appointment",
      "qualified",
      "won",
      "lost",
    ])
    .optional(),

  notes: z.string().optional(),

  priority: z
    .enum(["cold", "warm", "hot"])
    .optional(),

  followUpDate: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid lead id" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();

    const data: any = {
      ...parsed.data,
    };

    // 🔥 AUTO DATES
    if (
      parsed.data.status &&
      parsed.data.status !== "new"
    ) {
      data.lastContactedAt = new Date();
    }

    if (parsed.data.status === "won") {
      data.convertedAt = new Date();
    }

    // 🔥 FOLLOWUP
    if (parsed.data.followUpDate) {
      data.followUpDate = new Date(
        parsed.data.followUpDate
      );
    }

    const updated = await Lead.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error("PATCH LEAD ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
    req: Request,
    { params }: RouteContext
  ) {
    try {
      const { id } = await params;
  
      await connectDB();
  
      const deleted =
        await Lead.findByIdAndDelete(id);
  
      if (!deleted) {
        return NextResponse.json(
          { error: "Lead not found" },
          { status: 404 }
        );
      }
  
      return NextResponse.json({
        success: true,
      });
  
    } catch (error) {
      console.error(
        "DELETE LEAD ERROR:",
        error
      );
  
      return NextResponse.json(
        { error: "Delete failed" },
        { status: 500 }
      );
    }
  }