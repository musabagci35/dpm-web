import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getAdminSession } from "@/lib/adminSession";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";

const STATUSES = ["draft", "pending_review", "scheduled", "live", "ended", "sold", "reserve_not_met", "cancelled"];

/** Every auction, any status, with seller info attached — the moderation queue. */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  await resolveDueAuctions();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const flaggedOnly = searchParams.get("flagged") === "true";

  const query: any = {};
  if (status && STATUSES.includes(status)) query.status = status;
  if (flaggedOnly) query.flagged = true;

  const auctions = await AuctionListing.find(query)
    .sort({ flagged: -1, createdAt: -1 })
    .populate("sellerId", "email name phone")
    .lean();

  return NextResponse.json({ success: true, count: auctions.length, auctions });
}
