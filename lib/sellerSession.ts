import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { isSellerBlocked } from "@/lib/sellerModeration";

type SellerSessionPayload = {
  sellerId: string;
  sessionVersion?: number;
};

/**
 * Its own cookie ("seller-token") and its own JWT payload shape — entirely
 * separate from lib/adminSession.ts's "admin-token". A seller session can
 * never be mistaken for (or escalated into) a dealer-staff admin session,
 * and vice versa.
 *
 * The JWT itself is stateless, so real revocation ("log out everywhere"
 * after a password reset, deactivation, etc.) is enforced here by comparing
 * the sessionVersion the token was signed with against the seller's current
 * value in the database — bumping that value invalidates every token issued
 * before the bump, without needing a server-side session/token store.
 */
export async function getSellerSession(): Promise<SellerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("seller-token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  let decoded: SellerSessionPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as SellerSessionPayload;
    if (!decoded.sellerId) return null;
  } catch {
    return null;
  }

  await connectDB();
  const seller = await MarketplaceSeller.findById(decoded.sellerId).select(
    "sessionVersion status"
  );
  if (!seller || isSellerBlocked(seller.status)) return null;
  if ((decoded.sessionVersion || 0) !== (seller.sessionVersion || 0)) return null;

  return decoded;
}
