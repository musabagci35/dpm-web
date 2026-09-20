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
    case "title_pending":
      return "Title Pending";
    case "parts_only":
      return "Parts Only";
    case "unknown":
      return null;
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

/** "2d 4h left" / "45m left" / "Ending soon" / "Ended" — never invented, always computed from the real endsAt. */
export function formatTimeRemaining(endsAt?: string | null): string {
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "Ended";

  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  if (minutes > 2) return `${minutes}m left`;
  return "Ending soon";
}

export function formatBidAmount(amount?: number | null): string {
  if (amount == null) return "No bids yet";
  return `$${amount.toLocaleString()}`;
}
