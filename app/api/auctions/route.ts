import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { getSellerSession } from "@/lib/sellerSession";
import { toPublicAuctionListing } from "@/lib/publicAuctionListing";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";
import { rateLimit } from "@/lib/rateLimit";
import { isVinAlreadyActive, DUPLICATE_VIN_ERROR } from "@/lib/duplicateVin";

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
  const query: any = {
    status: allowedStatuses.includes(status) ? status : "live",
    adminHidden: { $ne: true },
    // A flagged auction (admin-flagged, or auto-flagged at 3+ public
    // reports) drops out of public view pending review — same treatment as
    // adminHidden, not merely a marker admins happen to see later.
    flagged: { $ne: true },
  };

  const make = searchParams.get("make");
  if (make) query.make = new RegExp(make.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const model = searchParams.get("model");
  if (model) query.model = new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const titleStatus = searchParams.get("titleStatus");
  if (titleStatus) query.titleStatus = titleStatus;

  // Number(null) coerces to 0 (not NaN) — parsing an absent param directly
  // would silently turn "no filter" into "mileage/price must be exactly 0"
  // and hide every real result. Only parse when the param is actually present.
  const minMileageParam = searchParams.get("minMileage");
  const maxMileageParam = searchParams.get("maxMileage");
  const minMileage = minMileageParam ? Number(minMileageParam) : NaN;
  const maxMileage = maxMileageParam ? Number(maxMileageParam) : NaN;
  if (Number.isFinite(minMileage) || Number.isFinite(maxMileage)) {
    query.mileage = {};
    if (Number.isFinite(minMileage)) query.mileage.$gte = minMileage;
    if (Number.isFinite(maxMileage)) query.mileage.$lte = maxMileage;
  }

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const minPrice = minPriceParam ? Number(minPriceParam) : NaN;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : NaN;
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

  const limited = rateLimit(`auction-create:${session.sellerId}`, 10, 60 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many auctions created recently. Please try again later." },
      { status: 429 }
    );
  }

  await connectDB();
  const body = await req.json().catch(() => ({}));

  const vin = String(body.vin || "").trim().toUpperCase();
  if (vin && (await isVinAlreadyActive(vin))) {
    return NextResponse.json({ error: DUPLICATE_VIN_ERROR }, { status: 409 });
  }

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
    vin,
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
    location: String(body.location || "").trim(),
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
