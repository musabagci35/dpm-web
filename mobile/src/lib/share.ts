import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

/**
 * The one public web origin every canonical vehicle share link points to —
 * regardless of which host the app itself is currently talking to (see
 * API_BASE_URL in ./api) — because a share link has to work for whoever
 * receives it, on any device, with or without this app installed. It's a
 * real, indexable, server-rendered page (Open Graph tags + JSON-LD), not a
 * deep link only this app can open.
 */
export const WEB_BASE_URL = "https://www.driveprimemotorsllc.com";

export type ShareableVehicle = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  location?: string;
  photoUrl?: string;
  url: string;
};

function formatShareMileage(mileage?: number): string | null {
  if (!mileage || mileage <= 0) return null;
  return `${Number(mileage).toLocaleString()} miles`;
}

function formatSharePrice(price?: number): string {
  if (!price || price <= 0) return "Call for Price";
  return `$${Number(price).toLocaleString()}`;
}

export function vehicleShareTitle(vehicle: ShareableVehicle): string {
  return [vehicle.year || "", vehicle.make, vehicle.model, vehicle.trim]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function shareDetailsLine(vehicle: ShareableVehicle): string {
  return [formatShareMileage(vehicle.mileage), formatSharePrice(vehicle.price), vehicle.location]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The exact text show to the customer in the in-app preview before they
 * confirm — and the exact text handed to the OS share sheet. Only ever the
 * fields a shopper already sees on the public listing itself: title,
 * mileage, price, location, and the link. Never a phone number, email, or
 * any internal id, regardless of what the caller passes in.
 *
 * iOS's share sheet accepts `message` and `url` as separate fields, and
 * link-preview-capable targets (Messages, Facebook) render `url` as its own
 * rich preview card — appending the link into the text too would duplicate
 * it. Android's Share module has no separate `url` field at all (RN ignores
 * it there), so the link has to live inside the text or it never gets sent.
 */
export function buildShareText(vehicle: ShareableVehicle): string {
  const title = vehicleShareTitle(vehicle);
  const details = shareDetailsLine(vehicle);
  const lines = [title, details].filter(Boolean);
  if (Platform.OS !== "ios") lines.push(vehicle.url);
  return lines.join("\n");
}

/**
 * Opens the native iOS/Android share sheet — the customer picks WhatsApp,
 * Messages, Facebook, Email, or any other installed app themselves, and
 * that app sends using whichever account the customer is already signed
 * into on their own device. This app never touches those accounts, never
 * asks for their passwords, and never sends anything on its own — the
 * customer still has to confirm inside the app they picked. Resolves
 * quietly on a user-cancelled share (not an error).
 */
export async function shareVehicle(vehicle: ShareableVehicle): Promise<boolean> {
  const message = buildShareText(vehicle);
  try {
    const result = await Share.share(
      Platform.OS === "ios" ? { message, url: vehicle.url } : { message },
      { dialogTitle: "Share this vehicle" }
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export async function copyVehicleLink(url: string): Promise<void> {
  await Clipboard.setStringAsync(url);
}

export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

/**
 * Same native-share-sheet mechanics as shareVehicle, but for an already-
 * composed, customer-edited caption (the Marketing Center) rather than the
 * auto-built summary — the customer already reviewed and could edit this
 * exact text before tapping Share, so there's no separate preview step
 * layered on top of it here.
 */
export async function shareCustomText(text: string, url: string): Promise<boolean> {
  try {
    const result = await Share.share(
      Platform.OS === "ios" ? { message: text, url } : { message: text },
      { dialogTitle: "Share this vehicle" }
    );
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}
