import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type SellerSessionPayload = {
  sellerId: string;
};

/**
 * Its own cookie ("seller-token") and its own JWT payload shape — entirely
 * separate from lib/adminSession.ts's "admin-token". A seller session can
 * never be mistaken for (or escalated into) a dealer-staff admin session,
 * and vice versa.
 */
export async function getSellerSession(): Promise<SellerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("seller-token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as SellerSessionPayload;
    if (!decoded.sellerId) return null;
    return decoded;
  } catch {
    return null;
  }
}
