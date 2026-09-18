import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";

const REPORT_REASONS = ["suspicious", "inaccurate", "spam", "already_sold", "other"];

/** Public — anyone viewing a live listing can report it, no account required. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = REPORT_REASONS.includes(body.reason) ? body.reason : "other";
  const message = String(body.message || "").trim().slice(0, 1000);

  await connectDB();

  const listing = await MarketplaceListing.findById(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  listing.reports.push({ reason, message, reportedAt: new Date() });
  // Three or more independent reports is enough to surface a listing for
  // admin attention without it being live-hidden on a single report.
  if (listing.reports.length >= 3) {
    listing.flagged = true;
  }
  await listing.save();

  return NextResponse.json({ success: true });
}
