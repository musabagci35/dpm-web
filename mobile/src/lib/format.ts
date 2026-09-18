export function formatPrice(price?: number) {
  const value = Number(price || 0);
  if (!value || value <= 0) return "Call for Price";
  return `$${value.toLocaleString()}`;
}

export function formatMileage(mileage?: number) {
  if (!mileage || mileage <= 0) return "Mileage not listed";
  return `${Number(mileage).toLocaleString()} miles`;
}

/**
 * The public API never returns a stored `title` field (it was dropped from
 * the safe field contract), so the title is always derived from the
 * structured year/make/model/trim fields.
 */
export function vehicleTitle(vehicle: {
  year: number;
  make: string;
  model: string;
  trim?: string;
}) {
  return (
    [vehicle.year || "", vehicle.make, vehicle.model, vehicle.trim]
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" ") || "Vehicle"
  );
}

export function coverImageUrl(
  images?: { url: string; isCover?: boolean }[]
): string | null {
  if (!images || images.length === 0) return null;
  const cover = images.find((image) => image.isCover);
  return (cover || images[0])?.url || null;
}

/** Car.titleStatus is an enum; "unknown" means the dealer hasn't recorded it. */
export function titleStatusLabel(status?: string): string | null {
  switch (String(status || "").toLowerCase()) {
    case "clean":
      return "Clean";
    case "salvage":
      return "Salvage";
    case "rebuilt":
      return "Rebuilt";
    case "parts_only":
      return "Parts Only";
    default:
      return null;
  }
}

export function formatSoldDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}
