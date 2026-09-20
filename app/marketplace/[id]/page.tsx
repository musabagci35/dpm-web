import mongoose from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { toPublicListing } from "@/lib/publicMarketplaceListing";
import { proImage } from "@/lib/cloudinaryImage";

const SITE_URL = "https://www.driveprimemotorsllc.com";

/**
 * A listing is only ever fetched here if it's live and not adminHidden —
 * the exact same rule the mobile app's public API enforces (see
 * app/api/marketplace/listings/[id]/route.ts). A frozen/suspended/deleted
 * seller's listings are always adminHidden by the moderation cascade, so
 * this one check is sufficient without a second lookup against the seller.
 */
async function getVisibleListing(id: string) {
  await connectDB();
  const raw: any = mongoose.Types.ObjectId.isValid(id)
    ? await MarketplaceListing.findById(id).lean()
    : await MarketplaceListing.findOne({ slug: id }).lean();

  if (!raw || raw.status !== "live" || raw.adminHidden) return null;
  return raw;
}

function formatPrice(value: number) {
  if (!value || value <= 0) return "Call for Price";
  return `$${value.toLocaleString()}`;
}

function formatMileage(value: number) {
  if (!value || value <= 0) return "Mileage not listed";
  return `${value.toLocaleString()} miles`;
}

function buildSchema(listing: ReturnType<typeof toPublicListing>, title: string, image: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: { "@type": "Brand", name: listing.make },
    model: listing.model,
    vehicleModelDate: listing.year,
    mileageFromOdometer: listing.mileage || undefined,
    image: image ? [image] : undefined,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/marketplace/${listing._id}`,
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
  const raw = await getVisibleListing(id);
  if (!raw) return { title: "Listing Not Found | Drive Prime Motors" };

  const listing = toPublicListing(raw);
  const title = [listing.year, listing.make, listing.model, listing.trim]
    .filter(Boolean)
    .join(" ");
  const priceLabel = formatPrice(listing.price);
  const mileageLabel = formatMileage(listing.mileage);
  const description = `${priceLabel} · ${mileageLabel} · Private seller listing on Drive Prime Motors`;
  const coverImage = listing.images.find((img: { url: string; isCover?: boolean }) => img.isCover)?.url || listing.images[0]?.url;
  const url = `${SITE_URL}/marketplace/${listing._id}`;

  return {
    title: `${title} | Drive Prime Motors`,
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

export default async function MarketplaceListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getVisibleListing(id);
  if (!raw) return notFound();

  const listing = toPublicListing(raw);
  const title = [listing.year, listing.make, listing.model, listing.trim]
    .filter(Boolean)
    .join(" ");
  const coverImage = listing.images.find((img: { url: string; isCover?: boolean }) => img.isCover)?.url || listing.images[0]?.url;
  const schema = buildSchema(listing, title, coverImage ? proImage(coverImage) : "");

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
          / Private Seller Listing
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
            <span className="inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
              Private Seller
            </span>
            <h1 className="mt-3 text-2xl font-black text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{formatMileage(listing.mileage)}</p>
            <p className="mt-2 text-3xl font-black text-red-600">{formatPrice(listing.price)}</p>

            {listing.description ? (
              <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{listing.description}</p>
            ) : null}

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
              This vehicle belongs to a private seller and is not owned by, or part of the
              inventory of, Drive Prime Motors LLC. Drive Prime Motors only hosts this listing.
              Open this link in the Drive Prime Motors app to contact the seller.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
