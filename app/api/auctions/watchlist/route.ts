import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";
import { toPublicAuctionListing } from "@/lib/publicAuctionListing";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";

/** Auctions the signed-in user is watching. */
export async function GET() {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to view your watchlist." }, { status: 401 });
  }

  await connectDB();
  await resolveDueAuctions();

  const auctions = await AuctionListing.find({ watchedBy: session.sellerId }).sort({ endsAt: 1 }).lean();
  return NextResponse.json({ success: true, auctions: auctions.map(toPublicAuctionListing) });
}
