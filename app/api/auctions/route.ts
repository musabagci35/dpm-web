import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";
import { toPublicAuctionListing } from "@/lib/publicAuctionListing";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";

const SORTS: Record<string, any> = {
  ending_soon: { endsAt: 1 },
  newest: { createdAt: -1 },
  lowest_bid: { currentBid: 1, startingBid: 1 },
  most_bids: { bidCount: -1 },
};

/** Public auction board — live (default), scheduled ("Upcoming"), or a specific status, with filters/sort. */
export async function GET(req: Request) {
  await connectDB();
  await resolveDueAuctions();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "live";
  const allowedStatuses = ["live", "scheduled", "sold", "ended", "reserve_not_met"];
  const query: any = { status: allowedStatuses.includes(status) ? status : "live" };

  const make = searchParams.get("make");
  if (make) query.make = new RegExp(make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const model = searchParams.get("model");
  if (model) query.model = new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const titleStatus = searchParams.get("titleStatus");
  if (titleStatus) query.titleStatus = titleStatus;

  const minMileage = Number(searchParams.get("minMileage"));
  const maxMileage = Number(searchParams.get("maxMileage"));
  if (Number.isFinite(minMileage) || Number.isFinite(maxMileage)) {
    query.mileage = {};
    if (Number.isFinite(minMileage)) query.mileage.$gte = minMileage;
    if (Number.isFinite(maxMileage)) query.mileage.$lte = maxMileage;
  }

  const minPrice = Number(searchParams.get("minPrice"));
  const maxPrice = Number(searchParams.get("maxPrice"));
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    const range: any = {};
    if (Number.isFinite(minPrice)) range.$gte = minPrice;
    if (Number.isFinite(maxPrice)) range.$lte = maxPrice;
    query.$or = [{ currentBid: range }, { currentBid: null, startingBid: range }];
  }

  const endingBefore = searchParams.get("endingBefore");
  if (endingBefore) {
    const date = new Date(endingBefore);
    if (!Number.isNaN(date.getTime())) query.endsAt = { ...(query.endsAt || {}), $lte: date };
  }

  const sortKey = searchParams.get("sort") || "";
  const sort = SORTS[sortKey] || SORTS.ending_soon;

  const limit = Math.min(Number(searchParams.get("limit")) || 60, 100);

  const auctions = await AuctionListing.find(query).sort(sort).limit(limit).lean();

  return NextResponse.json({ success: true, auctions: auctions.map(toPublicAuctionListing) });
}

/** Creates a new draft auction for the signed-in seller. */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to create an auction." }, { status: 401 });
  }

  await connectDB();
  const body = await req.json().catch(() => ({}));

  const mileage = Number(body.mileage);
  if (!Number.isFinite(mileage) || mileage < 0) {
    return NextResponse.json({ error: "Enter the vehicle's mileage." }, { status: 400 });
  }

  const startingBid = Number(body.startingBid);
  if (!Number.isFinite(startingBid) || startingBid <= 0) {
    return NextResponse.json({ error: "Enter a valid starting bid." }, { status: 400 });
  }

  const bidIncrement = Number(body.bidIncrement);
  if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
    return NextResponse.json({ error: "Enter a valid bid increment." }, { status: 400 });
  }

  const durationHours = Number(body.durationHours);
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return NextResponse.json({ error: "Choose an auction duration." }, { status: 400 });
  }

  const reservePrice =
    body.reservePrice != null && body.reservePrice !== "" ? Number(body.reservePrice) : null;
  const buyItNowPrice =
    body.buyItNowPrice != null && body.buyItNowPrice !== "" ? Number(body.buyItNowPrice) : null;

  const allowedTitleStatuses = ["clean", "salvage", "rebuilt", "title_pending", "unknown"];
  const titleStatus = allowedTitleStatuses.includes(body.titleStatus) ? body.titleStatus : "unknown";

  const images = Array.isArray(body.images)
    ? body.images
        .filter((img: any) => img?.url)
        .map((img: any, i: number) => ({ url: img.url, publicId: img.publicId || "", isCover: Boolean(img.isCover) || i === 0 }))
    : [];

  const video =
    body.video && body.video.url
      ? { url: body.video.url, publicId: body.video.publicId || "", durationMs: Number(body.video.durationMs) || 0, thumbnailUrl: body.video.thumbnailUrl || "" }
      : null;

  const auction = await AuctionListing.create({
    sellerId: session.sellerId,
    vin: String(body.vin || "").trim().toUpperCase(),
    year: Number(body.year) || 0,
    make: String(body.make || "").trim(),
    model: String(body.model || "").trim(),
    trim: String(body.trim || "").trim(),
    engine: String(body.engine || "").trim(),
    transmission: String(body.transmission || "").trim(),
    drivetrain: String(body.drivetrain || "").trim(),
    fuelType: String(body.fuelType || "").trim(),
    bodyClass: String(body.bodyClass || "").trim(),
    mileage,
    titleStatus,
    description: String(body.description || "").trim(),
    disclosures: String(body.disclosures || "").trim(),
    contactName: String(body.contactName || "").trim(),
    contactPhone: String(body.contactPhone || "").trim(),
    contactEmail: String(body.contactEmail || "").trim(),
    contactPreference: ["phone", "email", "either"].includes(body.contactPreference) ? body.contactPreference : "either",
    images,
    video,
    startingBid,
    reservePrice,
    bidIncrement,
    buyItNowPrice,
    durationHours,
    status: "draft",
    isTest: Boolean(body.isTest),
  });

  return NextResponse.json({ success: true, auction }, { status: 201 });
}
