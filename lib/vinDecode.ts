import { connectDB } from "@/lib/mongodb";
import VinCheck from "@/models/VinCheck";
import { rateLimit } from "@/lib/rateLimit";

const NHTSA_ENDPOINT =
  "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — decoded VIN data doesn't change
const FETCH_TIMEOUT_MS = 8000;

/**
 * Bumped whenever mapNhtsaResult starts deriving a field that older cached
 * documents don't contain. A cached result from an earlier version is treated
 * as stale and re-decoded, so new fields backfill themselves instead of
 * silently returning empty for the next 30 days.
 */
const VIN_RESULT_SCHEMA_VERSION = 2;

export type VinDecodeResult = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  body: string;
  doors: string;
  engine: string;
  engineCode: string;
  displacementL: string;
  cylinders: string;
  horsepower: string;
  transmission: string;
  fuel: string;
  /** Raw NHTSA DriveType value, e.g. "4x2" or "FWD/Front-Wheel Drive". */
  driveType: string;
  /** Readable label for the same value — never a guess beyond what NHTSA said. */
  drivetrain: string;
  manufacturer: string;
  plantCountry: string;
  plantState: string;
  plantCity: string;
  hasData: boolean;
  source: "NHTSA vPIC";
  decodedAt: string;
  cached: boolean;
  schemaVersion: number;
};

export class VinDecodeError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export function isValidVin(vin: unknown): vin is string {
  return typeof vin === "string" && /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
}

/**
 * Re-labels NHTSA's DriveType codes into something a shopper can read. This is
 * a presentation of what NHTSA returned, not an inference: "4x2" stays "4x2"
 * because the VIN does not say whether it is front- or rear-wheel drive.
 */
function driveTypeLabel(raw: string): string {
  const value = String(raw || "").trim();
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

/**
 * Builds a human-readable engine description out of whichever NHTSA engine
 * fields actually came back — e.g. "2.0L 4-cyl 146 hp (LFC5)". Every part is
 * omitted when NHTSA didn't provide it rather than filled with a placeholder.
 */
function buildEngineLabel(item: any): string {
  const parts: string[] = [];

  const displacement = String(item.DisplacementL || "").trim();
  if (displacement) {
    const rounded = Number(displacement);
    parts.push(
      `${Number.isFinite(rounded) ? rounded.toFixed(1) : displacement}L`
    );
  }

  const cylinders = String(item.EngineCylinders || "").trim();
  if (cylinders) parts.push(`${cylinders}-cyl`);

  const configuration = String(item.EngineConfiguration || "").trim();
  if (configuration && !cylinders) parts.push(configuration);

  const horsepower = String(item.EngineHP || "").trim();
  if (horsepower) parts.push(`${Math.round(Number(horsepower))} hp`);

  const code = String(item.EngineModel || "").trim();

  if (parts.length === 0) return code;
  if (code) return `${parts.join(" ")} (${code})`;
  return parts.join(" ");
}

function mapNhtsaResult(
  vin: string,
  item: any,
  decodedAt: string,
  cached: boolean
): VinDecodeResult {
  const hasData = Boolean(item.Make || item.Model || item.ModelYear);
  const driveType = item.DriveType || "";

  return {
    vin,
    year: item.ModelYear || "",
    make: item.Make || "",
    model: item.Model || "",
    trim: item.Trim || item.Series || "",
    body: item.BodyClass || "",
    doors: item.Doors || "",
    engine: buildEngineLabel(item),
    engineCode: item.EngineModel || "",
    displacementL: item.DisplacementL || "",
    cylinders: item.EngineCylinders || "",
    horsepower: item.EngineHP || "",
    transmission: item.TransmissionStyle || "",
    fuel: item.FuelTypePrimary || "",
    driveType,
    drivetrain: driveTypeLabel(driveType),
    manufacturer: item.Manufacturer || item.ManufacturerName || "",
    plantCountry: item.PlantCountry || "",
    plantState: item.PlantState || "",
    plantCity: item.PlantCity || "",
    hasData,
    source: "NHTSA vPIC",
    decodedAt,
    cached,
    schemaVersion: VIN_RESULT_SCHEMA_VERSION,
  };
}

async function fetchFromNhtsa(vin: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${NHTSA_ENDPOINT}/${vin}?format=json`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new VinDecodeError(
        "NHTSA VIN service is currently unavailable. Please try again shortly.",
        502
      );
    }

    const data = await res.json();
    const item = data?.Results?.[0];

    if (!item) {
      throw new VinDecodeError("NHTSA returned no data for this VIN.", 502);
    }

    return item;
  } catch (err: any) {
    if (err instanceof VinDecodeError) throw err;

    if (err?.name === "AbortError") {
      throw new VinDecodeError("The VIN lookup timed out. Please try again.", 504);
    }

    throw new VinDecodeError(
      "VIN decode failed. Please check your connection and try again.",
      502
    );
  } finally {
    clearTimeout(timeout);
  }
}

function isFreshCacheEntry(existing: any): boolean {
  if (!existing?.result || !existing.updatedAt) return false;
  if (existing.result.schemaVersion !== VIN_RESULT_SCHEMA_VERSION) return false;
  return Date.now() - new Date(existing.updatedAt).getTime() < CACHE_TTL_MS;
}

/**
 * Decodes a VIN via the free NHTSA vPIC API, with a 30-day database cache
 * (models/VinCheck) and optional per-IP rate limiting. Server-side only —
 * never call fetch to NHTSA directly from a client component.
 */
export async function getVinDecodeResult(
  rawVin: string,
  options: { ip?: string; rateLimitMax?: number } = {}
): Promise<VinDecodeResult> {
  const vin = String(rawVin || "").trim().toUpperCase();

  if (!isValidVin(vin)) {
    throw new VinDecodeError("Please enter a valid 17-character VIN.", 400);
  }

  if (options.ip) {
    const limit = rateLimit(
      `vin-decode:${options.ip}`,
      options.rateLimitMax ?? 20,
      10 * 60 * 1000
    );

    if (!limit.success) {
      throw new VinDecodeError(
        "Too many VIN lookups. Please wait a few minutes and try again.",
        429
      );
    }
  }

  await connectDB();

  const existing: any = await VinCheck.findOne({ vin }).lean();

  if (isFreshCacheEntry(existing)) {
    return { ...(existing.result as VinDecodeResult), cached: true };
  }

  const item = await fetchFromNhtsa(vin);
  const decodedAt = new Date().toISOString();
  const result = mapNhtsaResult(vin, item, decodedAt, false);

  await VinCheck.findOneAndUpdate(
    { vin },
    { vin, result },
    { upsert: true, new: true }
  );

  return result;
}

/**
 * Cache-only lookup used when enriching inventory listings: returns the stored
 * decode for a VIN if one is already cached and current, and otherwise null.
 * Never calls NHTSA, so it is safe to call while rendering a list of vehicles.
 */
export async function getCachedVinDecode(
  rawVin: string
): Promise<VinDecodeResult | null> {
  const vin = String(rawVin || "").trim().toUpperCase();
  if (!isValidVin(vin)) return null;

  const existing: any = await VinCheck.findOne({ vin }).lean();
  if (!isFreshCacheEntry(existing)) return null;

  return { ...(existing.result as VinDecodeResult), cached: true };
}
