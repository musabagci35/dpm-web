import { API_BASE_URL, ApiError, VehicleImage } from "./api";
import { ListingVideo, TitleStatus } from "./marketplaceApi";

export type AuctionStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "live"
  | "paused"
  | "ended"
  | "sold"
  | "reserve_not_met"
  | "cancelled";

export type VehicleHistoryReportInfo = { url: string; source: string; reportDate: string | null } | null;

export type AuctionBid = { bidderLabel: string; amount: number; placedAt: string };

export type PublicAuction = {
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
  description?: string;
  disclosures?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPreference?: "phone" | "email" | "either";
  images: VehicleImage[];
  video: ListingVideo | null;
  vehicleHistoryReport: VehicleHistoryReportInfo;
  startingBid: number;
  hasReserve: boolean;
  reserveMet: boolean;
  bidIncrement: number;
  buyItNowPrice: number | null;
  durationHours: number;
  startsAt: string | null;
  endsAt: string | null;
  currentBid: number | null;
  nextMinBid: number;
  bidCount: number;
  bids: AuctionBid[];
  status: AuctionStatus;
  isTest?: boolean;
  createdAt?: string;
};

export type MyAuction = PublicAuction & { rejectionReason?: string };

export type AdminAuction = MyAuction & {
  sellerId: { _id: string; email: string; name?: string; phone?: string } | string;
  reports: { reason: string; message?: string; reportedAt: string }[];
  flagged: boolean;
  flagReason?: string;
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

function normalizeAuction(value: any): PublicAuction {
  return {
    ...value,
    _id: String(value?._id || ""),
    slug: String(value?.slug || value?._id || ""),
    year: Number(value?.year) || 0,
    mileage: Number(value?.mileage) || 0,
    titleStatus: (value?.titleStatus || "unknown") as TitleStatus,
    status: (value?.status || "draft") as AuctionStatus,
    images: Array.isArray(value?.images) ? value.images : [],
    video: value?.video?.url ? value.video : null,
    bids: Array.isArray(value?.bids) ? value.bids : [],
    bidCount: Number(value?.bidCount) || 0,
    startingBid: Number(value?.startingBid) || 0,
    bidIncrement: Number(value?.bidIncrement) || 0,
  };
}

/* ------------------------------------------------------------------ *
 * Public browse / detail
 * ------------------------------------------------------------------ */

export type AuctionFilters = {
  status?: "live" | "scheduled" | "sold" | "ended" | "reserve_not_met";
  make?: string;
  model?: string;
  titleStatus?: TitleStatus;
  minMileage?: number;
  maxMileage?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "ending_soon" | "newest" | "lowest_bid" | "most_bids";
  limit?: number;
};

export async function fetchAuctions(filters?: AuctionFilters): Promise<PublicAuction[]> {
  const query = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    });
  }
  const qs = query.toString();
  const data = await requestJson(`${API_BASE_URL}/api/auctions${qs ? `?${qs}` : ""}`);
  const list = Array.isArray(data?.auctions) ? data.auctions : [];
  return list.map(normalizeAuction);
}

export async function fetchAuction(id: string): Promise<PublicAuction | MyAuction> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}`);
  return normalizeAuction(data);
}

export async function reportAuction(
  id: string,
  reason: "suspicious" | "inaccurate" | "spam" | "already_sold" | "other",
  message?: string
): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, message }),
  });
}

/* ------------------------------------------------------------------ *
 * Bidding & watching
 * ------------------------------------------------------------------ */

export async function placeBid(id: string, amount: number): Promise<{ currentBid: number; bidCount: number }> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return data;
}

export async function toggleWatchAuction(id: string): Promise<boolean> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}/watch`, { method: "POST" });
  return Boolean(data?.watching);
}

export async function fetchWatchlist(): Promise<PublicAuction[]> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/watchlist`);
  const list = Array.isArray(data?.auctions) ? data.auctions : [];
  return list.map(normalizeAuction);
}

/* ------------------------------------------------------------------ *
 * Seller's own auctions
 * ------------------------------------------------------------------ */

export async function fetchMyAuctions(): Promise<MyAuction[]> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/mine`);
  const list = Array.isArray(data?.auctions) ? data.auctions : [];
  return list.map(normalizeAuction) as MyAuction[];
}

export type AuctionInput = {
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
  description?: string;
  disclosures?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactPreference?: "phone" | "email" | "either";
  images?: VehicleImage[];
  video?: ListingVideo | null;
  startingBid: number;
  reservePrice?: number | null;
  bidIncrement: number;
  buyItNowPrice?: number | null;
  durationHours: number;
  isTest?: boolean;
};

export async function createAuction(input: AuctionInput): Promise<MyAuction> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeAuction(data?.auction || data) as MyAuction;
}

export async function updateAuction(id: string, input: Partial<AuctionInput> & { vehicleHistoryReportUrl?: string }): Promise<MyAuction> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeAuction(data) as MyAuction;
}

export async function submitAuction(id: string): Promise<MyAuction> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}/submit`, { method: "POST" });
  return normalizeAuction(data?.auction || data) as MyAuction;
}

export async function deleteAuction(id: string): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ *
 * Admin moderation
 * ------------------------------------------------------------------ */

export async function fetchAdminAuctions(params?: { status?: AuctionStatus; flagged?: boolean }): Promise<AdminAuction[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.flagged) query.set("flagged", "true");
  const qs = query.toString();
  const data = await requestJson(`${API_BASE_URL}/api/admin/auctions${qs ? `?${qs}` : ""}`);
  const list = Array.isArray(data?.auctions) ? data.auctions : [];
  return list.map(normalizeAuction) as AdminAuction[];
}

export type AuctionModerationInput = Partial<AuctionInput> & {
  status?: AuctionStatus;
  rejectionReason?: string;
  flagged?: boolean;
  flagReason?: string;
  vehicleHistoryReport?: { url: string; source: "carfax" | "seller_provided" | "other"; reportDate?: string; approved?: boolean };
  startsAt?: string;
};

export async function moderateAuction(id: string, input: AuctionModerationInput): Promise<AdminAuction> {
  const data = await requestJson(`${API_BASE_URL}/api/auctions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return normalizeAuction(data) as AdminAuction;
}
