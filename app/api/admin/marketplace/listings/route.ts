import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getAdminSession } from "@/lib/adminSession";
import { resolveDueListings } from "@/lib/resolveListingState";

const STATUSES = [
  "draft",
  "payment_pending",
  "pending_review",
  "live",
  "rejected",
  "sold",
  "expired",
];

/**
 * Every marketplace listing, any status, with the seller's account info and
 * payment status attached — this is the moderation queue. Individual
 * listing detail/approve/reject/edit/delete is handled by the shared
 * /api/marketplace/listings/[id] route, which already branches on an admin
 * session for full access.
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  await resolveDueListings();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const flaggedOnly = searchParams.get("flagged") === "true";

  const query: any = {};
  if (status && STATUSES.includes(status)) query.status = status;
  if (flaggedOnly) query.flagged = true;

  const listings = await MarketplaceListing.find(query)
    .sort({ flagged: -1, createdAt: -1 })
    .populate("sellerId", "email name phone")
    .lean();

  return NextResponse.json({ success: true, count: listings.length, listings });
}
