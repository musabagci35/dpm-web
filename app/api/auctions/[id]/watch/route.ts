import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";

/** Toggles the signed-in user watching this auction. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to watch an auction." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  await connectDB();
  const bidderId = new mongoose.Types.ObjectId(session.sellerId);

  const auction = await AuctionListing.findById(id).select("watchedBy");
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  const isWatching = auction.watchedBy.some((w: any) => String(w) === String(bidderId));
  await AuctionListing.updateOne(
    { _id: id },
    isWatching ? { $pull: { watchedBy: bidderId } } : { $addToSet: { watchedBy: bidderId } }
  );

  return NextResponse.json({ success: true, watching: !isWatching });
}
