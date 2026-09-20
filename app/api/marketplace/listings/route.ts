import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getSellerSession } from "@/lib/sellerSession";
import { toPublicListing } from "@/lib/publicMarketplaceListing";
import { resolveDueListings } from "@/lib/resolveListingState";

/**
 * Public marketplace browse — only ever "live" listings, and only ever the
 * public-safe field set. A listing past its 30-day window is lazily flipped
 * to "expired" here (no separate cron job in this first version) so it never
 * shows as live to a shopper past its window.
 */
export async function GET(req: Request) {
  await connectDB();
  await resolveDueListings();

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const query: any = { status: "live" };
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ make: regex }, { model: regex }, { trim: regex }];
  }

  const listings = await MarketplaceListing.find(query)
    .sort({ featured: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({
    success: true,
    listings: listings.map(toPublicListing),
  });
}

/**
 * Creates a new draft listing for the signed-in seller. Nothing here is
 * published yet — a draft is only visible to its own seller and to admins
 * until it's paid for and approved.
 */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to create a listing." }, { status: 401 });
  }

  await connectDB();

  const body = await req.json().catch(() => ({}));

  const mileage = Number(body.mileage);
  if (!Number.isFinite(mileage) || mileage < 0) {
    return NextResponse.json(
      { error: "Enter the vehicle's mileage." },
      { status: 400 }
    );
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "Enter a valid asking price." },
      { status: 400 }
    );
  }

  const allowedTitleStatuses = ["clean", "salvage", "rebuilt", "title_pending", "unknown"];
  const titleStatus = allowedTitleStatuses.includes(body.titleStatus)
    ? body.titleStatus
    : "unknown";

  const images = Array.isArray(body.images)
    ? body.images
        .filter((img: any) => img?.url)
        .map((img: any, i: number) => ({
          url: img.url,
          publicId: img.publicId || "",
          isCover: Boolean(img.isCover) || i === 0,
        }))
    : [];

  const video =
    body.video && body.video.url
      ? {
          url: body.video.url,
          publicId: body.video.publicId || "",
          durationMs: Number(body.video.durationMs) || 0,
          thumbnailUrl: body.video.thumbnailUrl || "",
        }
      : null;

  const listing = await MarketplaceListing.create({
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
    price,
    description: String(body.description || "").trim(),
    contactName: String(body.contactName || "").trim(),
    contactPhone: String(body.contactPhone || "").trim(),
    contactEmail: String(body.contactEmail || "").trim(),
    contactPreference: ["phone", "email", "either"].includes(body.contactPreference)
      ? body.contactPreference
      : "either",
    images,
    video,
    status: "draft",
    isTest: Boolean(body.isTest),
  });

  return NextResponse.json({ success: true, listing }, { status: 201 });
}
