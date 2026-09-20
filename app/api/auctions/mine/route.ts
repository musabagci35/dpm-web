import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";

/** A seller's own auctions, every status, full detail (never public). */
export async function GET() {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to view your auctions." }, { status: 401 });
  }

  await connectDB();
  await resolveDueAuctions();

  const auctions = await AuctionListing.find({ sellerId: session.sellerId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, auctions });
}
