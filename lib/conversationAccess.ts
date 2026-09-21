import { getAdminSession } from "@/lib/adminSession";
import { getSellerSession } from "@/lib/sellerSession";

export type ConversationParty = {
  role: "admin" | "customer" | "seller";
  senderId: string;
  actorEmail?: string;
  actorRole?: string;
};

/**
 * Resolves which party (if any) the current request is authorized to act as
 * on a given conversation — an admin (any dealership staff member, for
 * oversight/reply), the conversation's customer, or the conversation's
 * seller (only set when the context is that seller's own listing/auction).
 *
 * Never trusts a client-supplied role — always derived from the session
 * cookie plus the conversation's own stored customerId/sellerId, so a
 * message's senderType/senderId can never be spoofed from the client (see
 * app/api/conversations/[id]/messages/route.ts).
 */
export async function resolveConversationParty(conversation: {
  customerId: unknown;
  sellerId: unknown;
}): Promise<ConversationParty | null> {
  const [adminSession, sellerSession] = await Promise.all([
    getAdminSession(),
    getSellerSession(),
  ]);

  if (adminSession) {
    return { role: "admin", senderId: adminSession.userId, actorRole: adminSession.role };
  }

  if (sellerSession) {
    const sellerId = String(sellerSession.sellerId);
    if (String(conversation.customerId) === sellerId) {
      return { role: "customer", senderId: sellerId };
    }
    if (conversation.sellerId && String(conversation.sellerId) === sellerId) {
      return { role: "seller", senderId: sellerId };
    }
  }

  return null;
}
