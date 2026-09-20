import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";

/**
 * Places a bid with a single atomic findOneAndUpdate — the match condition
 * re-checks the minimum bid against whatever currentBid is stored in the
 * database AT THE MOMENT OF THE WRITE (via $expr), not a value read moments
 * earlier. MongoDB serializes writes to a single document, so of two
 * simultaneous bids only one can ever satisfy this condition; the other's
 * update simply matches zero documents and is rejected with a clear
 * "someone else just bid" error instead of corrupting state.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to place a bid." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid bid amount." }, { status: 400 });
  }

  await connectDB();

  const existing = await AuctionListing.findById(id).select("sellerId status");
  if (!existing) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }
  if (String(existing.sellerId) === String(session.sellerId)) {
    return NextResponse.json({ error: "You cannot bid on your own auction." }, { status: 403 });
  }

  const now = new Date();
  const bidderId = new mongoose.Types.ObjectId(session.sellerId);

  const update: any = {
    $set: { currentBid: amount, currentBidderId: bidderId },
    $push: { bids: { bidderId, amount, placedAt: now } },
    $inc: { bidCount: 1 },
  };

  const updated = await AuctionListing.findOneAndUpdate(
    {
      _id: id,
      status: "live",
      endsAt: { $gt: now },
      $expr: {
        $gte: [
          amount,
          {
            $cond: [
              { $ne: ["$currentBid", null] },
              { $add: ["$currentBid", "$bidIncrement"] },
              "$startingBid",
            ],
          },
        ],
      },
    },
    update,
    { new: true }
  );

  if (!updated) {
    // Distinguish "auction isn't live/has ended" from "bid too low" for a
    // clear message, without racing the write above.
    const current = await AuctionListing.findById(id).select("status endsAt currentBid startingBid bidIncrement");
    if (!current || current.status !== "live" || current.endsAt <= now) {
      return NextResponse.json({ error: "This auction is no longer accepting bids." }, { status: 409 });
    }
    const minBid = current.currentBid != null ? current.currentBid + current.bidIncrement : current.startingBid;
    return NextResponse.json(
      { error: `Someone just placed a higher bid. The minimum bid is now $${minBid.toLocaleString()}.` },
      { status: 409 }
    );
  }

  // Buy-It-Now: a bid at or above it ends the auction immediately as sold.
  if (updated.buyItNowPrice != null && amount >= updated.buyItNowPrice) {
    await AuctionListing.updateOne(
      { _id: id, status: "live" },
      { $set: { status: "sold", endsAt: now } }
    );
  }

  return NextResponse.json({ success: true, currentBid: amount, bidCount: updated.bidCount });
}
