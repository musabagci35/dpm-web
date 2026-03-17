import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {

    const db = await connectDB();

    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully",
      readyState: db.connection.readyState
    });

  } catch (error) {

    console.error("MongoDB connection error:", error);

    return NextResponse.json({
      success: false,
      error: "MongoDB connection failed"
    }, { status: 500 });

  }
}