import { API_BASE_URL, ApiError } from "./api";
import { DEALER_PHONE } from "./constants";

/**
 * Same real number Drive Prime Motors already publishes for WhatsApp
 * click-to-chat on the web site (components/MobileStickLead.tsx) — the
 * dealership's actual phone number, via WhatsApp's wa.me link format.
 */
export function buildWhatsAppUrl(prefillText?: string): string {
  const digits = DEALER_PHONE.replace(/\D/g, "");
  const text = prefillText ? `?text=${encodeURIComponent(prefillText)}` : "";
  return `https://wa.me/${digits}${text}`;
}

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export type ContactAiContext = {
  vehicleId?: string;
  marketplaceListingId?: string;
  auctionId?: string;
};

/**
 * Server-side, inventory/FAQ-grounded reply (app/api/contact-ai/route.ts).
 * If the server reports the AI provider isn't configured, that error
 * message is surfaced as-is rather than papered over with a fake reply.
 */
export async function askContactCenterAI(message: string, context?: ContactAiContext): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/contact-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ...context }),
    });
  } catch {
    throw new ApiError("Could not reach Drive Prime Motors. Check your connection and try again.");
  }
  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.reply) {
    throw new ApiError(typeof data?.error === "string" ? data.error : "The AI Assistant couldn't respond right now.", res.status);
  }
  return data.reply as string;
}
