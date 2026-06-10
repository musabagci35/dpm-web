import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Part from "@/models/Part";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { partId } = await req.json();

    if (!partId) {
      return NextResponse.json(
        { success: false, error: "Part ID is required" },
        { status: 400 }
      );
    }

    const part = await Part.findById(partId);

    if (!part) {
      return NextResponse.json(
        { success: false, error: "Part not found" },
        { status: 404 }
      );
    }

    part.ebayStatus = "listed";
    part.ebayItemId = `TEST-${part._id.toString()}`;
    part.ebayLastSyncedAt = new Date();
    part.ebayError = "";

    await part.save();

    return NextResponse.json({
      success: true,
      message: "Test eBay publish completed",
      ebayItemId: part.ebayItemId,
    });
  } catch (error) {
    console.error("EBAY PUBLISH ERROR:", error);

    return NextResponse.json(
      { success: false, error: "eBay publish failed" },
      { status: 500 }
    );
  }
}