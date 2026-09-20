import { API_BASE_URL, ApiError, VehicleHistoryReportInfo, VehicleImage } from "./api";

export type TitleStatus = "clean" | "salvage" | "rebuilt" | "title_pending" | "unknown";
export type ListingStatus =
  | "draft"
  | "payment_pending"
  | "pending_review"
  | "live"
  | "rejected"
  | "sold"
  | "expired";

export type ListingVideo = {
  url: string;
  publicId?: string;
  durationMs?: number;
  thumbnailUrl?: string;
};

/** Public-safe shape — what a buyer browsing the marketplace ever sees. */
export type PublicListing = {
  _id: string;
  slug: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  bodyClass?: string;
  mileage: number;
  titleStatus: TitleStatus;
  price: number;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPreference?: "phone" | "email" | "either";
  location?: string;
  images: VehicleImage[];
  video: ListingVideo | null;
  vehicleHistoryReport?: VehicleHistoryReportInfo;
  status: ListingStatus;
  featured: boolean;
  /** Only ever present on the owner/admin's own full-detail fetch — a public fetch never returns a hidden listing at all. */
  adminHidden?: boolean;
  /** Only ever present on the admin's own full-detail fetch — the owning seller's current account status. */
  sellerStatus?: string;
  isTest?: boolean;
  listingExpiresAt?: string | null;
  createdAt?: string;
};

/** Full document a seller sees for their own listing (same shape, always full detail). */
export type MyListing = PublicListing & {
  rejectionReason?: string;
};

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function requestJson(url: string, init?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...init });
  } catch {
    throw new ApiError("Could not reach Drive Prime Motors. Check your connection and try again.");
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ApiError(typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`, res.status);
  }
  return data;
}

function normalizeListing(value: any): PublicListing {
  return {
    ...value,
    _id: String(value?._id || ""),
    slug: String(value?.slug || value?._id || ""),
    year: Number(value?.year) || 0,
    mileage: Number(value?.mileage) || 0,
    price: Number(value?.price) || 0,
    titleStatus: (value?.titleStatus || "unknown") as TitleStatus,
    status: (value?.status || "draft") as ListingStatus,
    images: Array.isArray(value?.images) ? value.images : [],
    video: value?.video?.url ? value.video : null,
    featured: Boolean(value?.featured),
  };
}

/* ------------------------------------------------------------------ *
 * Public browse
 * ------------------------------------------------------------------ */

export async function fetchPublicListings(search?: string): Promise<PublicListing[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings${qs}`);
  const list = Array.isArray(data?.listings) ? data.listings : [];
  return list.map(normalizeListing);
}

export async function fetchListing(id: string): Promise<PublicListing | MyListing> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}`);
  return normalizeListing(data);
}

export async function reportListing(
  id: string,
  reason: "suspicious" | "inaccurate" | "spam" | "already_sold" | "other",
  message?: string
): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, message }),
  });
}

/* ------------------------------------------------------------------ *
 * Seller's own listings
 * ------------------------------------------------------------------ */

export async function fetchMyListings(): Promise<MyListing[]> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings/mine`);
  const list = Array.isArray(data?.listings) ? data.listings : [];
  return list.map(normalizeListing);
}

export type ListingInput = {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  bodyClass?: string;
  mileage: number;
  titleStatus: TitleStatus;
  price: number;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPreference?: "phone" | "email" | "either";
  images?: VehicleImage[];
  video?: ListingVideo | null;
  isTest?: boolean;
  /** Seller-submitted only — server always forces source:"seller_provided", approved:false. */
  vehicleHistoryReportUrl?: string;
};

export async function createListing(input: ListingInput): Promise<MyListing> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeListing(data?.listing || data);
}

export async function updateListing(id: string, input: Partial<ListingInput>): Promise<MyListing> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeListing(data);
}

export async function deleteListing(id: string): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* ------------------------------------------------------------------ *
 * Checkout
 * ------------------------------------------------------------------ */

export async function startListingCheckout(id: string): Promise<string> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnScheme: "driveprimemotors" }),
  });
  if (!data?.url) throw new ApiError("Could not start checkout.");
  return data.url as string;
}

export async function startFeaturedCheckout(id: string): Promise<string> {
  const data = await requestJson(
    `${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}/featured-checkout`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnScheme: "driveprimemotors" }),
    }
  );
  if (!data?.url) throw new ApiError("Could not start checkout.");
  return data.url as string;
}

/* ------------------------------------------------------------------ *
 * Cloudinary signed upload (marketplace folder)
 * ------------------------------------------------------------------ */

export type MarketplaceCloudinarySignature = {
  timestamp: number;
  folder: string;
  signature: string;
  cloudName: string;
  apiKey: string;
  resourceType: "image" | "video";
};

export async function getMarketplaceCloudinarySignature(
  resourceType: "image" | "video" = "image"
): Promise<MarketplaceCloudinarySignature> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/cloudinary-sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });
  return data as MarketplaceCloudinarySignature;
}

/* ------------------------------------------------------------------ *
 * Admin moderation
 * ------------------------------------------------------------------ */

/** Every listing, any status, with the seller's account info attached. */
export type AdminListing = MyListing & {
  sellerId: { _id: string; email: string; name?: string; phone?: string } | string;
  reports: { reason: string; message?: string; reportedAt: string }[];
  payment?: { amountPaidCents?: number; paidAt?: string | null };
  featuredPayment?: { amountPaidCents?: number; paidAt?: string | null };
  flagged: boolean;
  flagReason?: string;
};

export async function fetchAdminMarketplaceListings(params?: {
  status?: ListingStatus;
  flagged?: boolean;
}): Promise<AdminListing[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.flagged) query.set("flagged", "true");
  const qs = query.toString();

  const data = await requestJson(`${API_BASE_URL}/api/admin/marketplace/listings${qs ? `?${qs}` : ""}`);
  const list = Array.isArray(data?.listings) ? data.listings : [];
  return list.map(normalizeListing) as AdminListing[];
}

export type ModerationInput = Partial<ListingInput> & {
  status?: ListingStatus;
  rejectionReason?: string;
  flagged?: boolean;
  flagReason?: string;
  vehicleHistoryReport?: { url: string; source: "carfax" | "seller_provided" | "other"; reportDate?: string; approved?: boolean };
};

/**
 * Admin moderation actions go through the same PATCH
 * /api/marketplace/listings/[id] route updateListing() calls — the backend
 * grants full field + status access there once it sees an admin session.
 */
export async function moderateListing(id: string, input: ModerationInput): Promise<AdminListing> {
  const data = await requestJson(`${API_BASE_URL}/api/marketplace/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeListing(data) as AdminListing;
}

