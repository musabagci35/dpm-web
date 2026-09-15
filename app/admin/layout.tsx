"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

const CHROMELESS_ROUTES = ["/admin", "/admin/login"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (CHROMELESS_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return <AdminShell>{children}</AdminShell>;
}
