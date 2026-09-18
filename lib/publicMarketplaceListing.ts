/**
 * The only MarketplaceListing fields any public (unauthenticated) endpoint
 * may return. Payment internals (Stripe ids/amounts), moderation notes,
 * reports, and the seller's login email are deliberately excluded — only
 * the seller's own listing-contact info (which they entered specifically to
 * be shown to buyers) is included.
 */
export function toPublicListing(listing: any) {
  return {
    _id: String(listing._id ?? ""),
    slug: String(listing.slug || listing._id || ""),
    vin: String(listing.vin || ""),
    year: Number(listing.year) || 0,
    make: String(listing.make || ""),
    model: String(listing.model || ""),
    trim: String(listing.trim || ""),
    engine: String(listing.engine || ""),
    transmission: String(listing.transmission || ""),
    drivetrain: String(listing.drivetrain || ""),
    fuelType: String(listing.fuelType || ""),
    bodyClass: String(listing.bodyClass || ""),
    mileage: Number(listing.mileage) || 0,
    titleStatus: String(listing.titleStatus || "unknown"),
    price: Number(listing.price) || 0,
    description: String(listing.description || ""),
    contactName: String(listing.contactName || ""),
    contactPhone: String(listing.contactPhone || ""),
    contactEmail: String(listing.contactEmail || ""),
    contactPreference: String(listing.contactPreference || "either"),
    images: Array.isArray(listing.images)
      ? listing.images.map((img: any) => ({
          url: img.url,
          publicId: img.publicId || undefined,
          isCover: Boolean(img.isCover),
        }))
      : [],
    video: listing.video?.url
      ? {
          url: listing.video.url,
          thumbnailUrl: listing.video.thumbnailUrl || "",
          durationMs: Number(listing.video.durationMs) || 0,
        }
      : null,
    status: String(listing.status || "draft"),
    featured: Boolean(listing.featured),
    isTest: Boolean(listing.isTest),
    listingExpiresAt: listing.listingExpiresAt
      ? new Date(listing.listingExpiresAt).toISOString()
      : null,
    createdAt: listing.createdAt ? new Date(listing.createdAt).toISOString() : undefined,
  };
}

export type PublicListing = ReturnType<typeof toPublicListing>;
