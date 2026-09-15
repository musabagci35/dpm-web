"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <div className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:bg-white">
        <div className="fixed h-screen w-64">
          <Suspense fallback={null}>
            <AdminSidebar />
          </Suspense>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-zinc-950 px-4 py-3 text-white lg:hidden">
          <Link href="/admin/dashboard" className="text-sm font-black">
            Drive Prime Motors Admin
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-4">
                <span className="font-black text-gray-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <Suspense fallback={null}>
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </Suspense>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
