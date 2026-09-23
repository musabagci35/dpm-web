/**
 * Web client for the existing server-side Contact Center AI route
 * (app/api/contact-ai/route.ts) — the same route the mobile app already
 * uses (mobile/src/lib/contactCenterApi.ts). No API key or prompt logic
 * lives here; this only calls the same-origin API route.
 */
export type ContactAiContext = {
  vehicleId?: string;
  marketplaceListingId?: string;
  auctionId?: string;
};

async function parseJsonSafe(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function askContactCenterAI(
  message: string,
  context?: ContactAiContext
): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/contact-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ...context }),
    });
  } catch {
    throw new Error(
      "Could not reach Drive Prime Motors. Check your connection and try again."
    );
  }

  const data = await parseJsonSafe(res);
  if (!res.ok || !data?.reply) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "The AI Assistant couldn't respond right now."
    );
  }

  return data.reply as string;
}
