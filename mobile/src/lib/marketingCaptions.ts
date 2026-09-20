/**
 * Every caption here is built exclusively from fields that are actually
 * stored on the listing/auction/vehicle record — never an assumed or
 * inferred claim. In particular this file never writes "clean title",
 * "no accidents", "financing available", or "warranty included" unless a
 * real stored field says so; title status and CARFAX availability are
 * included only because they're genuine, seller-attributed or
 * admin-verified stored fields, not guesses.
 */
export type MarketableVehicle = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  /** Already-formatted — "$12,000", "Current Bid: $15,500", or "Call for Price". Never computed here from a raw number that might be missing. */
  priceLabel: string;
  location?: string;
  /** Auctions only. */
  endsAt?: string | null;
  titleStatusLabel?: string | null;
  hasVehicleHistoryReport?: boolean;
  url: string;
};

export type MarketingPlatform =
  | "facebook"
  | "facebook_marketplace"
  | "craigslist"
  | "offerup"
  | "instagram";

export const MARKETING_PLATFORMS: { key: MarketingPlatform; label: string; manual?: boolean }[] = [
  { key: "facebook", label: "Facebook Post" },
  { key: "facebook_marketplace", label: "Facebook Marketplace", manual: true },
  { key: "craigslist", label: "Craigslist", manual: true },
  { key: "offerup", label: "OfferUp", manual: true },
  { key: "instagram", label: "Instagram Caption" },
];

function vehicleTitleLine(v: MarketableVehicle): string {
  return [v.year || "", v.make, v.model, v.trim].map((p) => String(p || "").trim()).filter(Boolean).join(" ");
}

function mileageLine(v: MarketableVehicle): string | null {
  if (!v.mileage || v.mileage <= 0) return null;
  return `${v.mileage.toLocaleString()} miles`;
}

function endsAtLine(v: MarketableVehicle): string | null {
  if (!v.endsAt) return null;
  const date = new Date(v.endsAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Auction ends ${date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
}

function detailBullets(v: MarketableVehicle): string[] {
  return [
    mileageLine(v),
    v.priceLabel,
    v.location || null,
    endsAtLine(v),
    v.titleStatusLabel ? `${v.titleStatusLabel} title` : null,
    v.hasVehicleHistoryReport ? "Vehicle history report available" : null,
  ].filter((line): line is string => Boolean(line));
}

export function generateCaption(platform: MarketingPlatform, v: MarketableVehicle): string {
  const title = vehicleTitleLine(v);
  const bullets = detailBullets(v);

  switch (platform) {
    case "facebook":
      return [
        `${title} — for sale!`,
        "",
        ...bullets,
        "",
        `See photos and details: ${v.url}`,
      ].join("\n");

    case "facebook_marketplace":
      return [title, "", ...bullets.map((b) => `• ${b}`), "", `Full listing: ${v.url}`].join("\n");

    case "craigslist":
      // Craigslist strips most rich formatting — plain dashes, no emoji.
      return [title, "", ...bullets.map((b) => `- ${b}`), "", `More photos and details: ${v.url}`].join("\n");

    case "offerup":
      return [title, "", ...bullets.map((b) => `• ${b}`), "", `Details: ${v.url}`].join("\n");

    case "instagram":
      return [
        `${title} 🚗`,
        "",
        ...bullets.map((b) => `• ${b}`),
        "",
        "Link in bio for the full listing.",
        "",
        [`#${String(v.year || "").trim()}`, `#${v.make}`, `#${v.model}`]
          .map((tag) => tag.replace(/\s+/g, ""))
          .filter((tag) => tag.length > 1)
          .join(" "),
      ].join("\n");

    default:
      return [title, ...bullets, v.url].join("\n");
  }
}

export const MANUAL_POSTING_NOTE =
  "Copy this text and photos, then paste them in directly — there's no official Facebook Marketplace or Craigslist posting API, so this is copy-ready for manual posting, never automated.";
