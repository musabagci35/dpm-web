import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}