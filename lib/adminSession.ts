import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type AdminSessionPayload = {
  userId: string;
  role: string;
};

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AdminSessionPayload;

    if (decoded.role !== "admin") return null;

    return decoded;
  } catch {
    return null;
  }
}
