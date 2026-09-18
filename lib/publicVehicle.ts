import { getCachedVinDecode, getVinDecodeResult } from "@/lib/vinDecode";

/**
 * The only Car fields any public (unauthenticated) endpoint is allowed to
 * read. Cost, recon, profit, ROI, buy limit, AI notes, auction lot data and
 * the full VIN are deliberately absent — adding a field here makes it visible
 * to the website, the mobile app and anyone else calling /api/public/*.
 */
export const PUBLIC_CAR_FIELDS = [
  "slug",
  "year",
  "make",
  "model",
  "trim",
  "price",
  "mileage",
  "status",
  "isActive",
  "isFeatured",
  "images",
  "description",
  "titleStatus",
  "engine",
  "transmission",
  "drivetrain",
  "fuelType",
  "bodyClass",
  "location",
  "videoUrl",
  "vin",
  "carfaxUrl",
  "updatedAt",
].join(" ");

export type PublicVehicleImage = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

export type PublicVehicle = {
  _id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  status: string;
  images: PublicVehicleImage[];
  description: string;
  titleStatus: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  fuelType: string;
  bodyClass: string;
  location: string;
  videoUrl: string;
  /** Only ever a dealer-entered real CARFAX link — never generated or inferred. */
  carfaxUrl: string;
  /** Last 6 characters of the VIN only — the full VIN is never published. */
  vinLast6: string;
  /**
   * "dealer" when every populated spec came from the dealer's own record,
   * "vin-decode" when at least one blank spec was filled from the vehicle's
   * NHTSA VIN decode. The mobile app shows this so a shopper knows where a
   * specification came from.
   */
  specsSource: "dealer" | "vin-decode";
  updatedAt?: string;
};

function imageList(value: any): PublicVehicleImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((image: any) => image && typeof image.url === "string" && image.url)
    .map((image: any) => ({
      url: image.url,
      publicId: image.publicId || undefined,
      isCover: Boolean(image.isCover),
    }));
}

function text(value: any): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Maps a lean Car document onto the public shape. `vin` is consumed here and
 * replaced with `vinLast6` so callers cannot accidentally forward it.
 */
export function toPublicVehicle(car: any): PublicVehicle {
  const vin = text(car?.vin).toUpperCase();

  return {
    _id: String(car?._id ?? ""),
    slug: text(car?.slug) || String(car?._id ?? ""),
    year: Number(car?.year) || 0,
    make: text(car?.make),
    model: text(car?.model),
    trim: text(car?.trim),
    price: Number(car?.price) || 0,
    mileage: Number(car?.mileage) || 0,
    status: text(car?.status) || "available",
    images: imageList(car?.images),
    description: text(car?.description),
    titleStatus: text(car?.titleStatus),
    engine: text(car?.engine),
    transmission: text(car?.transmission),
    drivetrain: text(car?.drivetrain),
    fuelType: text(car?.fuelType),
    bodyClass: text(car?.bodyClass),
    location: text(car?.location),
    videoUrl: text(car?.videoUrl),
    carfaxUrl: text(car?.carfaxUrl),
    vinLast6: vin.length === 17 ? vin.slice(-6) : "",
    specsSource: "dealer",
    updatedAt: car?.updatedAt ? new Date(car.updatedAt).toISOString() : undefined,
  };
}

const SPEC_KEYS = [
  ["engine", "engine"],
  ["transmission", "transmission"],
  ["drivetrain", "drivetrain"],
  ["fuelType", "fuel"],
  ["bodyClass", "body"],
] as const;

/**
 * Fills only the spec fields the dealer left blank, using the vehicle's own
 * NHTSA VIN decode. A value the dealer entered is never overwritten, and
 * nothing is invented — if the VIN doesn't decode, the field stays empty and
 * the UI renders its "not specified" state.
 *
 * `mode: "cached"` never contacts NHTSA (safe inside a list render);
 * `mode: "live"` will decode and cache on a miss (used for a single vehicle).
 */
export async function withDecodedSpecs(
  vehicle: PublicVehicle,
  vin: string,
  mode: "cached" | "live" = "cached"
): Promise<PublicVehicle> {
  const missing = SPEC_KEYS.filter(([carKey]) => !vehicle[carKey]);
  if (missing.length === 0 || !vin) return vehicle;

  let decoded: Awaited<ReturnType<typeof getCachedVinDecode>> = null;
  try {
    decoded =
      mode === "live"
        ? await getVinDecodeResult(vin)
        : await getCachedVinDecode(vin);
  } catch {
    // A decode failure is never fatal for a listing — the vehicle still
    // renders with whatever the dealer entered.
    return vehicle;
  }

  if (!decoded?.hasData) return vehicle;

  const filled: PublicVehicle = { ...vehicle };
  let usedDecode = false;

  for (const [carKey, decodeKey] of missing) {
    const value = text(decoded[decodeKey]);
    if (!value) continue;
    filled[carKey] = value;
    usedDecode = true;
  }

  if (usedDecode) filled.specsSource = "vin-decode";
  return filled;
}

/** True when a vehicle should be visible on public endpoints. */
export function isPubliclyVisible(car: any): boolean {
  const status = text(car?.status);
  if (status === "archived") return false;
  if (status === "sold") return true;
  return car?.isActive !== false;
}
