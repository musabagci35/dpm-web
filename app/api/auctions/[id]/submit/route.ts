import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";

/** Seller submits a completed draft for admin review. No payment step — unlike the fixed-price flow, auctions have no listing fee. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to submit your auction." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  await connectDB();
  const auction = await AuctionListing.findById(id);

  if (!auction || String(auction.sellerId) !== String(session.sellerId)) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  if (!["draft", "rejected"].includes(auction.status)) {
    return NextResponse.json(
      { error: `This auction is already ${auction.status.replace(/_/g, " ")}.` },
      { status: 409 }
    );
  }

  if (!auction.mileage && auction.mileage !== 0) {
    return NextResponse.json({ error: "Enter the vehicle's mileage first." }, { status: 400 });
  }
  if (!auction.startingBid) {
    return NextResponse.json({ error: "Enter a starting bid first." }, { status: 400 });
  }
  if (!auction.bidIncrement) {
    return NextResponse.json({ error: "Enter a bid increment first." }, { status: 400 });
  }
  if (!auction.durationHours) {
    return NextResponse.json({ error: "Choose an auction duration first." }, { status: 400 });
  }
  if (!auction.images?.length) {
    return NextResponse.json({ error: "Add at least one photo first." }, { status: 400 });
  }

  auction.status = "pending_review";
  auction.rejectionReason = "";
  await auction.save();

  return NextResponse.json({ success: true, auction });
}
