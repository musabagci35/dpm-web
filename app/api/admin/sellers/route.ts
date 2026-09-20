import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/adminSession";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Admin's view of every seller — name, email, phone, status, verification,
 * moderation notes and listing/auction/report counts. Never the
 * passwordHash, resetTokenHash, otpHash or biometricCredentialHash: an
 * admin can act on an account, but can never see or derive its password.
 *
 * Search matches name/email/phone directly, or a VIN against that seller's
 * own listings/auctions (so "search by VIN" finds the seller who listed it,
 * not a listing search).
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const statusFilter = (searchParams.get("status") || "").trim();

  const query: any = {};
  if (statusFilter && ["active", "frozen", "suspended", "deleted"].includes(statusFilter)) {
    query.status = statusFilter;
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const vinMatchSellerIds = await Promise.all([
      MarketplaceListing.find({ vin: regex }).distinct("sellerId"),
      AuctionListing.find({ vin: regex }).distinct("sellerId"),
    ]).then(([a, b]) => [...a, ...b]);

    query.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { _id: { $in: vinMatchSellerIds } },
    ];
  }

  const sellers = await MarketplaceSeller.find(query)
    .select(
      "email name phone status statusReason moderationNotes emailVerified phoneVerified createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  const sellerIds = sellers.map((s: any) => s._id);
  const [listingCounts, auctionCounts, flaggedListingCounts, flaggedAuctionCounts] = await Promise.all([
    MarketplaceListing.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]),
    AuctionListing.aggregate([
      { $match: { sellerId: { $in: sellerIds } } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]),
    MarketplaceListing.aggregate([
      { $match: { sellerId: { $in: sellerIds }, flagged: true } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]),
    AuctionListing.aggregate([
      { $match: { sellerId: { $in: sellerIds }, flagged: true } },
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (rows: any[]) => new Map(rows.map((c) => [String(c._id), c.count]));
  const listingCountBySeller = toMap(listingCounts);
  const auctionCountBySeller = toMap(auctionCounts);
  const flaggedListingBySeller = toMap(flaggedListingCounts);
  const flaggedAuctionBySeller = toMap(flaggedAuctionCounts);

  const result = sellers.map((seller: any) => {
    const id = String(seller._id);
    return {
      _id: id,
      email: seller.email,
      name: seller.name,
      phone: seller.phone,
      status: seller.status,
      statusReason: seller.statusReason || "",
      moderationNotes: seller.moderationNotes || [],
      emailVerified: seller.emailVerified,
      phoneVerified: seller.phoneVerified,
      createdAt: seller.createdAt,
      listingCount: listingCountBySeller.get(id) || 0,
      auctionCount: auctionCountBySeller.get(id) || 0,
      flaggedCount: (flaggedListingBySeller.get(id) || 0) + (flaggedAuctionBySeller.get(id) || 0),
    };
  });

  return NextResponse.json({ sellers: result });
}
