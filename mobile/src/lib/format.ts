export function formatPrice(price?: number) {
  const value = Number(price || 0);
  if (!value || value <= 0) return "Call for Price";
  return `$${value.toLocaleString()}`;
}

export function formatMileage(mileage?: number) {
  if (!mileage || mileage <= 0) return "Mileage unavailable";
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
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${
    vehicle.trim || ""
  }`.trim();
}

export function coverImageUrl(
  images?: { url: string; isCover?: boolean }[]
): string | null {
  if (!images || images.length === 0) return null;
  const cover = images.find((image) => image.isCover);
  return (cover || images[0])?.url || null;
}
