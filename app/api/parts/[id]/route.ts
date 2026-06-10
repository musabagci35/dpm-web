import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Part from "@/models/Part";

type Ctx = {
  params: Promise<{ id: string }>;
};

function makeSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;

    await connectDB();

    const part = await Part.findById(id).lean();

    if (!part) {
      return NextResponse.json(
        { success: false, error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, part });
  } catch (error) {
    console.error("GET PART ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const updateData: any = {
      ...body,
      ebayUrl: body.ebayUrl || "",
    };

    if (body.title) {
      updateData.slug = makeSlug(body.title);
    }

    const updated = await Part.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, part: updated });
  } catch (error) {
    console.error("UPDATE PART ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;

    await connectDB();

    const deleted = await Part.findByIdAndDelete(id).lean();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Part not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE PART ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}