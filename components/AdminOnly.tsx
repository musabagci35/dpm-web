"use client";

import { useSession } from "next-auth/react";

export default function AdminOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  <AdminOnly>
  <a href="/admin" className="rounded bg-black px-4 py-2 text-white">
    Admin Panel
  </a>
</AdminOnly>

  if (status === "loading") return null;
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}