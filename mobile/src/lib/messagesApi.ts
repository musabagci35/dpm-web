import { API_BASE_URL, ApiError } from "./api";

export type ConversationStatus = "open" | "escalated" | "closed";
export type SenderType = "customer" | "admin" | "seller";
export type ConversationContextType = "vehicle" | "marketplaceListing" | "auction";

export type Conversation = {
  _id: string;
  customerId: string;
  sellerId: string | null;
  adminId: string | null;
  vehicleId: string | null;
  marketplaceListingId: string | null;
  auctionId: string | null;
  leadId: string | null;
  status: ConversationStatus;
  humanTakeover: boolean;
  unreadForAdmin: boolean;
  unreadForSeller: boolean;
  lastMessageAt: string;
  createdAt: string;
  /** Present on both list endpoints — enriched with a human-readable vehicle/listing/auction label. */
  context?: { type: ConversationContextType; id: string; label: string };
  /** GET /api/admin/conversations only. */
  customerName?: string;
  customerEmail?: string;
  /** GET /api/conversations only — "customer" or "seller", whichever role the signed-in account plays in this conversation. */
  viewerRole?: "customer" | "seller";
  /** GET /api/conversations only — the other party's display name. */
  counterpartyName?: string;
  lastMessage?: { text: string; senderType: SenderType; createdAt: string } | null;
};

export type Message = {
  _id: string;
  conversationId: string;
  senderType: SenderType;
  senderId: string;
  text: string;
  aiGenerated: boolean;
  readAt: string | null;
  status: "sent" | "delivered" | "failed";
  createdAt: string;
};

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
    res = await fetch(url, { credentials: "include", ...init });
  } catch {
    throw new ApiError("Could not reach Drive Prime Motors. Check your connection and try again.");
  }
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    throw new ApiError(typeof data?.error === "string" ? data.error : `Request failed: ${res.status}`, res.status);
  }
  return data;
}

/* ------------------------------------------------------------------ *
 * Customer / seller (signed-in MarketplaceSeller account — the same
 * account plays both roles, see models/Conversation.ts)
 * ------------------------------------------------------------------ */

export async function createOrReuseConversation(context: {
  vehicleId?: string;
  marketplaceListingId?: string;
  auctionId?: string;
}): Promise<Conversation> {
  const data = await requestJson(`${API_BASE_URL}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(context),
  });
  return data.conversation as Conversation;
}

export async function fetchMyConversations(): Promise<Conversation[]> {
  const data = await requestJson(`${API_BASE_URL}/api/conversations`);
  return Array.isArray(data?.conversations) ? data.conversations : [];
}

export async function fetchConversation(id: string): Promise<{ conversation: Conversation; viewerRole: SenderType }> {
  const data = await requestJson(`${API_BASE_URL}/api/conversations/${encodeURIComponent(id)}`);
  return { conversation: data.conversation, viewerRole: data.viewerRole };
}

export async function fetchMessages(id: string): Promise<Message[]> {
  const data = await requestJson(`${API_BASE_URL}/api/conversations/${encodeURIComponent(id)}/messages`);
  return Array.isArray(data?.messages) ? data.messages : [];
}

export async function sendMessage(id: string, text: string): Promise<Message> {
  const data = await requestJson(`${API_BASE_URL}/api/conversations/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return data.message as Message;
}

export async function markConversationRead(id: string): Promise<void> {
  await requestJson(`${API_BASE_URL}/api/conversations/${encodeURIComponent(id)}/read`, { method: "POST" });
}

/** Total unread conversations across both the customer and seller roles of the signed-in account — for the tab-bar/inbox badge. */
export async function fetchUnreadConversationCount(): Promise<number> {
  const conversations = await fetchMyConversations();
  return conversations.filter((c) => c.unreadForSeller).length;
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export async function fetchAdminConversations(): Promise<Conversation[]> {
  const data = await requestJson(`${API_BASE_URL}/api/admin/conversations`);
  return Array.isArray(data?.conversations) ? data.conversations : [];
}

export async function fetchAdminUnreadConversationCount(): Promise<number> {
  const conversations = await fetchAdminConversations();
  return conversations.filter((c) => c.unreadForAdmin).length;
}

export type AdminConversationAction = "close" | "reopen" | "takeover";

export async function adminConversationAction(id: string, action: AdminConversationAction): Promise<Conversation> {
  const data = await requestJson(`${API_BASE_URL}/api/admin/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return data.conversation as Conversation;
}
