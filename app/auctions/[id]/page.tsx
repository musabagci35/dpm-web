import mongoose from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import { toPublicAuctionListing } from "@/lib/publicAuctionListing";
import { proImage } from "@/lib/cloudinaryImage";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";
import AuctionStatus from "./AuctionStatus";

const SITE_URL = "https://www.driveprimemotorsllc.com";

/** The same statuses + adminHidden + flagged rule the public API itself enforces — never draft/pending_review/paused, never admin-hidden, never flagged (auto-flagged at 3+ reports, same as admin-flagged). */
const PUBLIC_STATUSES = new Set(["live", "scheduled", "ended", "sold", "reserve_not_met"]);

async function getVisibleAuction(id: string) {
  await connectDB();
  // Same lazy state-resolution the API routes trigger on every read — a
  // "live" auction whose endsAt has already passed must never be shown (or
  // shared/indexed) as still live just because no cron job has swept it yet.
  await resolveDueAuctions();

  const raw: any = mongoose.Types.ObjectId.isValid(id)
    ? await AuctionListing.findById(id).lean()
    : await AuctionListing.findOne({ slug: id }).lean();

  if (!raw || !PUBLIC_STATUSES.has(raw.status) || raw.adminHidden || raw.flagged) return null;
  return raw;
}

function formatBid(value: number | null, startingBid: number) {
  if (value != null) return `$${value.toLocaleString()}`;
  return `$${startingBid.toLocaleString()} (starting)`;
}

function formatMileage(value: number) {
  if (!value || value <= 0) return "Mileage not listed";
  return `${value.toLocaleString()} miles`;
}

function buildSchema(auction: ReturnType<typeof toPublicAuctionListing>, title: string, image: string) {
  const available =
    auction.status === "live"
      ? "https://schema.org/InStock"
      : auction.status === "sold"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: { "@type": "Brand", name: auction.make },
    model: auction.model,
    vehicleModelDate: auction.year,
    mileageFromOdometer: auction.mileage || undefined,
    image: image ? [image] : undefined,
    offers: {
      "@type": "Offer",
      price: auction.currentBid ?? auction.startingBid,
      priceCurrency: "USD",
      availability: available,
      url: `${SITE_URL}/auctions/${auction._id}`,
      seller: { "@type": "Person", name: "Private Seller" },
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const raw = await getVisibleAuction(id);
  if (!raw) return { title: "Auction Not Found | Drive Prime Motors" };

  const auction = toPublicAuctionListing(raw);
  const title = [auction.year, auction.make, auction.model, auction.trim].filter(Boolean).join(" ");
  const bidLabel = formatBid(auction.currentBid, auction.startingBid);
  const description = `${bidLabel} · ${auction.bidCount} bids · ${formatMileage(auction.mileage)} · Private-seller auction on Drive Prime Motors`;
  const coverImage = auction.images.find((img: { url: string; isCover?: boolean }) => img.isCover)?.url || auction.images[0]?.url;
  const url = `${SITE_URL}/auctions/${auction._id}`;

  return {
    title: `${title} | Drive Prime Motors Auctions`,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: coverImage ? [{ url: proImage(coverImage) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverImage ? [proImage(coverImage)] : undefined,
    },
  };
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getVisibleAuction(id);
  if (!raw) return notFound();

  const auction = toPublicAuctionListing(raw);
  const title = [auction.year, auction.make, auction.model, auction.trim].filter(Boolean).join(" ");
  const coverImage = auction.images.find((img: { url: string; isCover?: boolean }) => img.isCover)?.url || auction.images[0]?.url;
  const schema = buildSchema(auction, title, coverImage ? proImage(coverImage) : "");
  const isLive = auction.status === "live";

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5 text-sm text-gray-500">
          <Link href="/" className="hover:text-red-600">
            Drive Prime Motors
          </Link>{" "}
          / Private Seller Auction
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proImage(coverImage)} alt={title} className="h-80 w-full object-cover" />
          ) : (
            <div className="flex h-80 items-center justify-center bg-gray-100 text-gray-400">
              No photo available
            </div>
          )}

          <div className="p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                Private Seller Auction
              </span>
              <AuctionStatus status={auction.status} endsAt={auction.endsAt} />
            </div>

            <h1 className="text-2xl font-black text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {formatMileage(auction.mileage)}
              {auction.location ? ` · ${auction.location}` : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl bg-gray-900 p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current Bid</p>
                <p className="text-3xl font-black text-white">
                  {formatBid(auction.currentBid, auction.startingBid)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Starting bid ${auction.startingBid.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Whether a reserve exists/is met is safe to disclose — the
                reserve amount itself never is, and toPublicAuctionListing
                never returns it. */}
            {auction.hasReserve && isLive ? (
              <p className="mt-3 text-sm font-semibold text-amber-700">
                {auction.reserveMet ? "✓ Reserve met" : "Reserve not yet met"}
              </p>
            ) : null}

            {isLive ? (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-600">
                  Open this auction in the Drive Prime Motors app to place a bid.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
                {auction.status === "sold"
                  ? "This auction has ended — sold."
                  : auction.status === "reserve_not_met"
                    ? "This auction ended — the reserve price was not met."
                    : auction.status === "scheduled"
                      ? "This auction hasn't started yet."
                      : "This auction has ended. Bidding is closed."}
              </div>
            )}

            {auction.description ? (
              <p className="mt-6 whitespace-pre-line text-sm text-gray-700">{auction.description}</p>
            ) : null}

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              This vehicle belongs to a private seller and is not owned by, or part of the
              inventory of, Drive Prime Motors LLC. Drive Prime Motors only hosts this auction.
              Open this link in the Drive Prime Motors app to bid or contact the seller.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
