const DEFAULT_BASE_URL = "https://www.driveprimemotorsllc.com";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

export type VehicleImage = {
  url: string;
  isCover?: boolean;
};

/**
 * Matches the exact field contract returned by GET /api/public/inventory
 * and GET /api/public/inventory/[slug]. Never contains cost/profit/ROI,
 * VIN, admin notes, or any other private field — the server already
 * strips those before this ever reaches the client.
 */
export type VehicleSummary = {
  _id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  status: string;
  images: VehicleImage[];
  description?: string;
};

export type VehicleDetail = VehicleSummary;

/** Matches the exact field contract returned by GET /api/public/recently-sold. */
export type RecentlySoldVehicle = {
  _id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  images: VehicleImage[];
};

export async function fetchInventory(params?: {
  search?: string;
  make?: string;
  model?: string;
}): Promise<VehicleSummary[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.make) query.set("make", params.make);
  if (params?.model) query.set("model", params.model);

  const qs = query.toString();
  const res = await fetch(
    `${API_BASE_URL}/api/public/inventory${qs ? `?${qs}` : ""}`
  );

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.vehicles as VehicleSummary[];
}

export async function fetchVehicle(
  slug: string
): Promise<VehicleDetail | null> {
  const res = await fetch(
    `${API_BASE_URL}/api/public/inventory/${encodeURIComponent(slug)}`
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const data = await res.json();
  return data.vehicle as VehicleDetail;
}

export async function fetchRecentlySold(): Promise<RecentlySoldVehicle[]> {
  const res = await fetch(`${API_BASE_URL}/api/public/recently-sold`);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  const data = await res.json();
  return data.vehicles as RecentlySoldVehicle[];
}

export type ContactLeadPayload = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  carId?: string;
};

export async function submitContactLead(
  payload: ContactLeadPayload
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
}
