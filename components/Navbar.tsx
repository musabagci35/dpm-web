"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">

      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link
          href="/admin/dashboard"
          className="text-xl font-extrabold tracking-tight"
        >
          Drive Prime Motors
        </Link>

        {/* NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">

          <Link href="/inventory" className="hover:text-red-600 transition">
            Inventory
          </Link>

          <Link href="/marketplace" className="hover:text-red-600 transition">
            Marketplace
          </Link>

          <Link href="/vin-report" className="hover:text-red-600 transition">
            VIN Report
          </Link>

          <Link href="/sell-your-car" className="hover:text-red-600 transition">
            Sell Your Car
          </Link>

          <Link href="/financing" className="hover:text-red-600 transition">
            Financing
          </Link>

          <Link href="/contact" className="hover:text-red-600 transition">
            Contact
          </Link>

        </nav>
        <a
  href="/admin/leads"
  className="border px-4 py-2 rounded-xl"
>
  Leads
</a>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">

          <Link
            href="/admin"
            className="hidden md:block border px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 transition"
          >
            Admin
          </Link>

          <a
            href="tel:+19162618880"
            className="hidden md:block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Call Now
          </a>

        </div>

      </div>

    </header>
  );
}