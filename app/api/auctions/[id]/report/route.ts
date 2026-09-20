import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";

const REPORT_REASONS = ["suspicious", "inaccurate", "spam", "already_sold", "other"];

/** Public — anyone viewing a live auction can report it, no account required. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = REPORT_REASONS.includes(body.reason) ? body.reason : "other";
  const message = String(body.message || "").trim().slice(0, 1000);

  await connectDB();
  const auction = await AuctionListing.findById(id);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  auction.reports.push({ reason, message, reportedAt: new Date() });
  if (auction.reports.length >= 3) auction.flagged = true;
  await auction.save();

  return NextResponse.json({ success: true });
}
