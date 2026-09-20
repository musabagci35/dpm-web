import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type AdminSessionPayload = {
  userId: string;
  role: string;
  sessionVersion?: number;
};

/**
 * Stateless JWT, but real revocation is enforced by comparing the
 * sessionVersion the token was signed with against the admin's current
 * value in the database — see lib/sellerSession.ts for the same pattern
 * and full rationale.
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  let decoded: AdminSessionPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET) as AdminSessionPayload;
    if (decoded.role !== "admin") return null;
  } catch {
    return null;
  }

  await connectDB();
  const user = await User.findById(decoded.userId).select("sessionVersion status");
  if (!user || user.status === "deactivated") return null;
  if ((decoded.sessionVersion || 0) !== (user.sessionVersion || 0)) return null;

  return decoded;
}
