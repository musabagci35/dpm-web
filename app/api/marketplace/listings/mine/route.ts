import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getSellerSession } from "@/lib/sellerSession";

/** A seller's own listings, every status, full detail (this is never public). */
export async function GET() {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to view your listings." }, { status: 401 });
  }

  await connectDB();

  const listings = await MarketplaceListing.find({ sellerId: session.sellerId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, listings });
}
