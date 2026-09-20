import { API_BASE_URL, ApiError } from "./api";

export type SellerStatus = "active" | "frozen" | "suspended" | "deleted";

export type ModerationNote = { note: string; addedByEmail: string; createdAt: string };

export type AdminSellerSummary = {
  _id: string;
  email: string;
  name: string;
  phone: string;
  status: SellerStatus;
  statusReason: string;
  moderationNotes: ModerationNote[];
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  listingCount: number;
  auctionCount: number;
  flaggedCount: number;
};

export type AdminSellerListingRow = {
  _id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  status: string;
  adminHidden: boolean;
  flagged: boolean;
  reports: { reason: string; message: string; reportedAt: string }[];
  price?: number;
  currentBid?: number;
  startingBid?: number;
  createdAt: string;
};

export type AdminSellerDetail = {
  seller: AdminSellerSummary;
  listings: AdminSellerListingRow[];
  auctions: AdminSellerListingRow[];
};

async function requestJson(url: string, init?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...init });
  } catch {
    throw new ApiError("Could not reach Drive Prime Motors. Check your connection and try again.");
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new ApiError(typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`, res.status);
  }
  return data;
}

export async function fetchAdminSellers(params?: {
  search?: string;
  status?: SellerStatus;
}): Promise<AdminSellerSummary[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const data = await requestJson(`${API_BASE_URL}/api/admin/sellers${qs ? `?${qs}` : ""}`);
  return Array.isArray(data?.sellers) ? data.sellers : [];
}

export async function fetchAdminSellerDetail(id: string): Promise<AdminSellerDetail> {
  return requestJson(`${API_BASE_URL}/api/admin/sellers/${encodeURIComponent(id)}`);
}

async function sellerAction(id: string, body: Record<string, unknown>): Promise<any> {
  return requestJson(`${API_BASE_URL}/api/admin/sellers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const freezeSeller = (id: string, reason: string) => sellerAction(id, { action: "freeze", reason });
export const unfreezeSeller = (id: string) => sellerAction(id, { action: "unfreeze" });
export const suspendSeller = (id: string, reason: string) => sellerAction(id, { action: "suspend", reason });
export const unsuspendSeller = (id: string) => sellerAction(id, { action: "unsuspend" });
export const revokeSellerSessions = (id: string) => sellerAction(id, { action: "revoke-sessions" });
export const disableSellerListings = (id: string) => sellerAction(id, { action: "disable-listings" });
export const enableSellerListings = (id: string) => sellerAction(id, { action: "enable-listings" });
export const sendSellerResetEmail = (id: string) => sellerAction(id, { action: "send-reset-email" });
export const addSellerNote = (id: string, note: string) => sellerAction(id, { action: "add-note", note });
export const deleteSellerAccount = (id: string, reason: string) =>
  sellerAction(id, { action: "delete", reason, confirm: true });
