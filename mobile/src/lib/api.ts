/**
 * The bare apex domain 307-redirects every request (including POSTs) to
 * https://www.driveprimemotorsllc.com at the Vercel platform level, before
 * any application code runs. A browser tab only pays that redirect once on
 * initial navigation and then talks same-origin from then on, so the
 * website never notices. This app issues an absolute-URL fetch for every
 * request, so hitting the apex meant every single call — including the
 * admin login POST and every follow-up session-verification GET — took a
 * redirect hop, and the admin-token cookie set on the redirected response
 * was unreliable to persist/resend across React Native's networking layer
 * on subsequent calls. Using the final (www) host directly removes the
 * redirect, and with it the intermittent "login succeeds but the session
 * never verifies" failure.
 */
const DEFAULT_BASE_URL = "https://www.driveprimemotorsllc.com";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL;

/** Free, official, key-less NHTSA services, used only as a fallback (see lookupVin). */
const NHTSA_DECODE_URL =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const NHTSA_RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";

export type VehicleImage = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

/**
 * Shared shape for a vehicle-history report across inventory, marketplace
 * listings, and auctions — null unless an admin-verified (or admin-approved
 * seller-provided) report actually exists. Never generated or inferred.
 */
export type VehicleHistoryReportInfo = { url: string; source: string; reportDate: string | null } | null;

/**
 * Matches the public field contract returned by /api/public/inventory,
 * /api/public/inventory/:slug and /api/public/recently-sold. The server strips
 * cost/profit/ROI, the full VIN and admin notes before this ever reaches the
 * client — `vinLast6` is the most VIN a shopper is ever shown.
 */
export type VehicleSummary = {
  _id: string;
  id?: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  mileage?: number;
  status: string;
  images: VehicleImage[];
  description?: string;
  titleStatus?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  bodyClass?: string;
  location?: string;
  videoUrl?: string;
  /** @deprecated superseded by vehicleHistoryReport. */
  carfaxUrl?: string;
  /** Null unless an admin-verified (or admin-approved seller) report exists. Never generated or inferred. */
  vehicleHistoryReport?: VehicleHistoryReportInfo;
  vinLast6?: string;
  /** "vin-decode" when a blank dealer spec was filled from the NHTSA decode. */
  specsSource?: "dealer" | "vin-decode";
  soldAt?: string;
  /** false = admin has soft-hidden this vehicle from the public site without changing its status. */
  isActive?: boolean;
};

export type VehicleDetail = VehicleSummary;
export type RecentlySoldVehicle = VehicleSummary;

/** The ten decoded facts the VIN screen is required to show. */
export type VinDecoded = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  fuel: string;
  body: string;
  transmission: string;
  drivetrain: string;
};

export type VinRecall = {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportedDate: string;
};

export type VinLookupResult = VinDecoded & {
  /** False when NHTSA has no record for the VIN — the UI says so explicitly. */
  hasData: boolean;
  decodeSource: string;
  foundInInventory: boolean;
  inventory: VehicleSummary[];
  car: VehicleSummary | null;
  recalls: VinRecall[];
  recallsAvailable: boolean;
  recallsError: string | null;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export function normalizeVin(value: string): string {
  return String(value || "").replace(/[\s-]/g, "").toUpperCase();
}

export function isVinLike(value: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(value));
}

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

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
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      "Could not reach Drive Prime Motors. Check your connection and try again."
    );
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message =
      typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data;
}

/** A candidate URL answering with one of these is "not this endpoint" — keep going. */
const ENDPOINT_MISSING = [404, 405];

/**
 * The legacy /api/cars fallbacks are admin-protected now, so for a public read
 * a 401/403 means "that endpoint can't answer this" rather than a real auth
 * problem, and must not be reported to a shopper as "Unauthorized".
 */
const PUBLIC_READ_SKIP = [401, 403, 404, 405];

/**
 * Tries each URL in order and moves on when the endpoint itself can't serve
 * the request. This is what lets the app run against an older deployment of
 * the website that predates the /api/public/* routes.
 */
async function requestFromCandidates(
  urls: string[],
  init?: RequestInit,
  skipStatuses: number[] = ENDPOINT_MISSING
): Promise<any> {
  let lastError: ApiError | null = null;

  for (const url of urls) {
    let res: Response;

    try {
      res = await fetch(url, init);
    } catch {
      lastError = new ApiError(
        "Could not reach Drive Prime Motors. Check your connection and try again."
      );
      continue;
    }

    const data = await parseJsonSafe(res);

    if (res.ok) return data;

    if (!skipStatuses.includes(res.status)) {
      throw new ApiError(
        typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`,
        res.status
      );
    }

    lastError = new ApiError(`Request failed: ${res.status}`, res.status);
  }

  throw lastError || new ApiError("Request failed");
}

function normalizeVehicle(value: any): VehicleSummary {
  const id = str(value?._id) || str(value?.id);
  return {
    ...value,
    _id: id,
    id,
    // Some older records were saved before slugs were generated; the detail
    // endpoint accepts an id, so it is a valid route parameter either way.
    slug: str(value?.slug) || id,
    year: Number(value?.year) || 0,
    make: str(value?.make),
    model: str(value?.model),
    status: str(value?.status),
    images: Array.isArray(value?.images) ? value.images : [],
  } as VehicleSummary;
}

function vehicleArray(data: any): VehicleSummary[] {
  const values = data?.vehicles || data?.cars || data?.data || [];
  return Array.isArray(values) ? values.map(normalizeVehicle) : [];
}

/* ------------------------------------------------------------------ *
 * Inventory
 * ------------------------------------------------------------------ */

export async function fetchInventory(params?: {
  search?: string;
  make?: string;
  model?: string;
}): Promise<VehicleSummary[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.make) query.set("make", params.make);
  if (params?.model) query.set("model", params.model);
  query.set("limit", "100");

  const qs = query.toString();
  const data = await requestFromCandidates(
    [
      `${API_BASE_URL}/api/public/inventory${qs ? `?${qs}` : ""}`,
      `${API_BASE_URL}/api/cars?${qs}`,
    ],
    undefined,
    PUBLIC_READ_SKIP
  );

  return vehicleArray(data);
}

export async function fetchVehicle(slug: string): Promise<VehicleDetail | null> {
  let data: any;

  try {
    data = await requestFromCandidates(
      [
        `${API_BASE_URL}/api/public/inventory/${encodeURIComponent(slug)}`,
        `${API_BASE_URL}/api/cars/${encodeURIComponent(slug)}`,
      ],
      undefined,
      PUBLIC_READ_SKIP
    );
  } catch (error) {
    // Every candidate said "no such listing" — that is a missing vehicle, not
    // an error, so the screen shows its "listing isn't available" state.
    if (error instanceof ApiError && PUBLIC_READ_SKIP.includes(error.status)) {
      return null;
    }
    throw error;
  }

  const value = data?.vehicle || data?.car || data;
  return value && (value._id || value.id) ? normalizeVehicle(value) : null;
}

export async function fetchRecentlySold(): Promise<RecentlySoldVehicle[]> {
  const data = await requestFromCandidates(
    [
      `${API_BASE_URL}/api/public/recently-sold`,
      `${API_BASE_URL}/api/cars?status=sold&includeSold=true&limit=100`,
    ],
    undefined,
    PUBLIC_READ_SKIP
  );

  // /api/public/recently-sold only ever returns sold vehicles, and older
  // deployments of it didn't include `status` at all — so only drop a vehicle
  // when it explicitly says it is something other than sold.
  return vehicleArray(data).filter(
    (vehicle) => !vehicle.status || vehicle.status === "sold"
  );
}

/* ------------------------------------------------------------------ *
 * VIN lookup
 * ------------------------------------------------------------------ */

function mapRecall(recall: any): VinRecall {
  return {
    campaignNumber: str(recall?.campaignNumber || recall?.NHTSACampaignNumber),
    component: str(recall?.component || recall?.Component),
    summary: str(recall?.summary || recall?.Summary),
    consequence: str(recall?.consequence || recall?.Consequence),
    remedy: str(recall?.remedy || recall?.Remedy),
    reportedDate: str(recall?.reportedDate || recall?.ReportReceivedDate),
  };
}

/**
 * Direct NHTSA vPIC decode. Only used when the dealer backend's own decode came
 * back missing fields (an older deployment of /api/vin returned just make,
 * model, year, engine, fuel and body). Same official source the backend uses.
 */
async function decodeVinFromNhtsa(vin: string): Promise<Partial<VinDecoded>> {
  try {
    const data = await requestJson(`${NHTSA_DECODE_URL}/${vin}?format=json`);
    const item = data?.Results?.[0];
    if (!item) return {};

    const displacement = str(item.DisplacementL);
    const cylinders = str(item.EngineCylinders);
    const horsepower = str(item.EngineHP);
    const engineCode = str(item.EngineModel);

    const engineParts: string[] = [];
    if (displacement) {
      const litres = Number(displacement);
      engineParts.push(
        `${Number.isFinite(litres) ? litres.toFixed(1) : displacement}L`
      );
    }
    if (cylinders) engineParts.push(`${cylinders}-cyl`);
    if (horsepower) engineParts.push(`${Math.round(Number(horsepower))} hp`);

    const engine = engineParts.length
      ? engineCode
        ? `${engineParts.join(" ")} (${engineCode})`
        : engineParts.join(" ")
      : engineCode;

    return {
      year: str(item.ModelYear),
      make: str(item.Make),
      model: str(item.Model),
      trim: str(item.Trim) || str(item.Series),
      engine,
      fuel: str(item.FuelTypePrimary),
      body: str(item.BodyClass),
      transmission: str(item.TransmissionStyle),
      drivetrain: driveTypeLabel(str(item.DriveType)),
    };
  } catch {
    return {};
  }
}

/** Mirrors the server's labelling so both paths read identically in the UI. */
function driveTypeLabel(raw: string): string {
  const value = str(raw);
  if (!value) return "";

  const lower = value.toLowerCase();
  if (lower.includes("front")) return "Front-Wheel Drive (FWD)";
  if (lower.includes("rear")) return "Rear-Wheel Drive (RWD)";
  if (lower.includes("all-wheel") || lower.includes("all wheel")) {
    return "All-Wheel Drive (AWD)";
  }
  if (lower.includes("4wd") || lower.includes("4x4")) {
    return "Four-Wheel Drive (4x4)";
  }
  if (lower === "4x2") return "Two-Wheel Drive (4x2)";
  return value;
}

async function fetchRecallsFromNhtsa(
  make: string,
  model: string,
  year: string
): Promise<{ recalls: VinRecall[]; available: boolean; error: string | null }> {
  if (!make || !model || !year) {
    return { recalls: [], available: false, error: null };
  }

  const query = new URLSearchParams({ make, model, modelYear: year });

  try {
    // NHTSA answers a make/model/year it has no recalls for with HTTP 400 and
    // a body of {"Count":0,...,"results":[]} — so the body decides, not the
    // status. requestJson would throw on the 400 and hide a valid "none".
    const res = await fetch(`${NHTSA_RECALLS_URL}?${query.toString()}`);
    const data = await parseJsonSafe(res);
    const results = Array.isArray(data?.results) ? data.results : null;

    if (!results) {
      return {
        recalls: [],
        available: true,
        error: "The NHTSA recall service could not be reached.",
      };
    }

    return { recalls: results.map(mapRecall), available: true, error: null };
  } catch {
    return {
      recalls: [],
      available: true,
      error: "The NHTSA recall service could not be reached.",
    };
  }
}

/** Looks up the VIN in inventory when the backend response didn't do it for us. */
async function findInventoryByVin(vin: string): Promise<VehicleSummary[]> {
  try {
    const matches = await fetchInventory({ search: vin });
    const last6 = vin.slice(-6);
    return matches.filter(
      (vehicle) => !vehicle.vinLast6 || vehicle.vinLast6 === last6
    );
  } catch {
    return [];
  }
}

/**
 * Decodes a VIN and reports whether Drive Prime Motors currently lists it.
 *
 * The dealer backend is the preferred source (it caches decodes, rate-limits
 * abuse and can match inventory in one round trip). Anything the backend did
 * not return is filled from the same official NHTSA services it uses, so the
 * screen shows a complete result even against an older deployment of the site.
 * Nothing here is ever synthesised: a field NHTSA has no value for stays empty
 * and the UI renders it as "Not provided by NHTSA".
 */
export async function lookupVin(vinValue: string): Promise<VinLookupResult> {
  const vin = normalizeVin(vinValue);

  if (!isVinLike(vin)) {
    throw new ApiError("Please enter a valid 17-character VIN.", 400);
  }

  let data: any = null;
  let backendError: ApiError | null = null;

  try {
    data = await requestJson(`${API_BASE_URL}/api/vin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vin }),
    });
  } catch (error) {
    // A 400/429 is a real answer about this VIN and should surface as-is.
    if (error instanceof ApiError && (error.status === 400 || error.status === 429)) {
      throw error;
    }
    backendError = error instanceof ApiError ? error : new ApiError("VIN lookup failed.");
  }

  const decoded: VinDecoded = {
    vin: str(data?.vin) || vin,
    year: str(data?.year),
    make: str(data?.make),
    model: str(data?.model),
    trim: str(data?.trim),
    engine: str(data?.engine),
    fuel: str(data?.fuel),
    body: str(data?.body),
    transmission: str(data?.transmission),
    // Newer backends send `drivetrain`; older ones sent the raw `driveType`.
    drivetrain: str(data?.drivetrain) || driveTypeLabel(str(data?.driveType)),
  };

  const required: (keyof VinDecoded)[] = [
    "year",
    "make",
    "model",
    "trim",
    "engine",
    "fuel",
    "body",
    "transmission",
    "drivetrain",
  ];
  const missing = required.filter((key) => !decoded[key]);

  let usedFallbackDecode = false;

  if (missing.length > 0) {
    const fallback = await decodeVinFromNhtsa(vin);
    for (const key of missing) {
      const value = str(fallback[key]);
      if (!value) continue;
      decoded[key] = value;
      usedFallbackDecode = true;
    }
  }

  const hasData = Boolean(decoded.make || decoded.model || decoded.year);

  if (!hasData && backendError) {
    // Neither the dealer backend nor NHTSA told us anything — this is a real
    // failure rather than a VIN with no record, so say so.
    throw backendError;
  }

  // Inventory: prefer the backend's own match, fall back to a VIN search.
  let inventory: VehicleSummary[];
  if (Array.isArray(data?.inventory)) {
    inventory = data.inventory.map(normalizeVehicle);
  } else {
    inventory = await findInventoryByVin(vin);
  }

  const car = data?.car
    ? normalizeVehicle(data.car)
    : inventory.length > 0
    ? inventory[0]
    : null;

  // Recalls: prefer the backend's, otherwise ask NHTSA directly.
  let recalls: VinRecall[];
  let recallsAvailable: boolean;
  let recallsError: string | null;

  if (Array.isArray(data?.recalls) && data?.recallsAvailable !== undefined) {
    recalls = data.recalls.map(mapRecall);
    recallsAvailable = Boolean(data.recallsAvailable);
    recallsError = str(data?.recallsError) || null;
  } else {
    const result = await fetchRecallsFromNhtsa(
      decoded.make,
      decoded.model,
      decoded.year
    );
    recalls = result.recalls;
    recallsAvailable = result.available;
    recallsError = result.error;
  }

  return {
    ...decoded,
    hasData,
    decodeSource:
      backendError || usedFallbackDecode
        ? "NHTSA vPIC"
        : "Drive Prime Motors (NHTSA vPIC)",
    foundInInventory: inventory.length > 0,
    inventory,
    car,
    recalls,
    recallsAvailable,
    recallsError,
  };
}

/**
 * Sends a captured photo to the shared vision-OCR endpoint and returns a
 * candidate VIN string for the caller to confirm or correct — never
 * auto-applied without confirmation, and never used to infer anything
 * beyond the VIN text itself (no mileage, title, or history comes from
 * this call). Shared by the public Sell flow (seller session) and Admin →
 * Add Vehicle (admin session); the caller must already be signed in as
 * one or the other, since this endpoint is gated to control OpenAI usage.
 */
export async function scanVinFromPhoto(imageBase64: string): Promise<string> {
  const data = await requestJson(`${API_BASE_URL}/api/vin-scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ imageBase64 }),
  });
  if (!data?.success || !data?.vin) {
    throw new ApiError(data?.error || "Could not read a VIN from that photo.");
  }
  return data.vin as string;
}

/* ------------------------------------------------------------------ *
 * Leads
 * ------------------------------------------------------------------ */

export type ContactLeadPayload = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  carId?: string;
  /** Set for a "Request This Vehicle" lead on a VIN we don't have listed. */
  vin?: string;
  carTitle?: string;
  source?: "inventory" | "vin";
};

export async function submitContactLead(
  payload: ContactLeadPayload
): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export type AdminCarInput = {
  title?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  vin?: string;
  description?: string;
  phone?: string;
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  bodyClass?: string;
  titleStatus?: "clean" | "salvage" | "rebuilt" | "title_pending" | "unknown";
  carfaxUrl?: string;
  vehicleHistoryReport?: { url: string; source: "carfax" | "seller_provided" | "other"; reportDate?: string; approved?: boolean };
  status?: "available" | "pending" | "sold" | "archived";
  images?: VehicleImage[];
};

/** Full admin car record — includes fields the public API strips. */
export type AdminVehicle = VehicleSummary & {
  phone?: string;
  vin?: string;
};

export async function fetchAdminInventory(): Promise<VehicleSummary[]> {
  const data = await requestJson(`${API_BASE_URL}/api/admin/cars`, {
    credentials: "include",
  });
  return vehicleArray(data);
}

export async function fetchAdminCar(id: string): Promise<AdminVehicle> {
  const data = await requestFromCandidates(
    [
      `${API_BASE_URL}/api/cars/${encodeURIComponent(id)}`,
      `${API_BASE_URL}/api/admin/cars/${encodeURIComponent(id)}`,
    ],
    { credentials: "include" }
  );
  return normalizeVehicle(data?.car || data);
}

export async function deleteAdminCar(id: string): Promise<void> {
  await requestFromCandidates(
    [
      `${API_BASE_URL}/api/admin/cars/${encodeURIComponent(id)}`,
      `${API_BASE_URL}/api/cars/${encodeURIComponent(id)}`,
    ],
    { method: "DELETE", credentials: "include" }
  );
}

export async function createAdminCar(input: AdminCarInput): Promise<VehicleSummary> {
  const data = await requestFromCandidates(
    [`${API_BASE_URL}/api/admin/cars`, `${API_BASE_URL}/api/cars`],
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  return normalizeVehicle(data?.car || data);
}

export async function updateAdminCar(
  id: string,
  input: Partial<AdminCarInput>
): Promise<VehicleSummary> {
  const data = await requestFromCandidates(
    [
      `${API_BASE_URL}/api/admin/cars/${encodeURIComponent(id)}`,
      `${API_BASE_URL}/api/cars/${encodeURIComponent(id)}`,
    ],
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  return normalizeVehicle(data?.car || data);
}

/* ------------------------------------------------------------------ *
 * Admin — leads
 * ------------------------------------------------------------------ */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "appointment"
  | "won"
  | "lost";

/** Matches models/Lead.ts as returned (unmodified) by GET /api/leads. */
export type AdminLead = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vin?: string;
  carId?: string | null;
  carTitle?: string;
  source: string;
  status: LeadStatus;
  priority?: string;
  createdAt: string;
};

function normalizeLead(value: any): AdminLead {
  return {
    _id: str(value?._id) || str(value?.id),
    name: str(value?.name),
    phone: str(value?.phone),
    email: str(value?.email),
    message: str(value?.message),
    vin: str(value?.vin),
    carId: value?.carId ? str(value.carId) : null,
    carTitle: str(value?.carTitle),
    source: str(value?.source) || "website",
    status: (str(value?.status) || "new") as LeadStatus,
    priority: str(value?.priority),
    createdAt: str(value?.createdAt),
  };
}

export async function fetchAdminLeads(): Promise<AdminLead[]> {
  const data = await requestJson(`${API_BASE_URL}/api/leads`, {
    credentials: "include",
  });
  const list = Array.isArray(data) ? data : data?.leads;
  return Array.isArray(list) ? list.map(normalizeLead) : [];
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<AdminLead> {
  const data = await requestJson(
    `${API_BASE_URL}/api/admin/leads/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    }
  );
  return normalizeLead(data?.lead || data);
}

/* ------------------------------------------------------------------ *
 * Admin — Cloudinary signed upload
 * ------------------------------------------------------------------ */

export type CloudinarySignature = {
  timestamp: number;
  folder: string;
  signature: string;
  cloudName: string;
  apiKey: string;
  resourceType?: "image" | "video" | "raw";
};

export async function getCloudinarySignature(
  folder: string,
  resourceType?: "image" | "raw"
): Promise<CloudinarySignature> {
  const res = await fetch(`${API_BASE_URL}/api/admin/cloudinary-sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ folder, resourceType }),
  });

  const data = await parseJsonSafe(res);

  if (!res.ok || !data?.signature) {
    throw new ApiError(
      typeof data?.error === "string"
        ? data.error
        : "Could not get an upload signature.",
      res.status
    );
  }

  return data as CloudinarySignature;
}
