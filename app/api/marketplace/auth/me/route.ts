import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { getSellerSession } from "@/lib/sellerSession";

export async function GET() {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const seller = await MarketplaceSeller.findById(session.sellerId).select("-passwordHash");
  if (!seller) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(seller);
}
