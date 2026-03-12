"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {

  const [vin, setVin] = useState("");
  const router = useRouter();

  function handleVinSearch() {
    if (!vin) return;
    router.push(`/vin-report?vin=${vin}`);
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">

      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-6">

        {/* LOGO */}
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight"
        >
          Drive Prime Motors
        </Link>

        {/* NAV LINKS */}
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

        {/* VIN SEARCH */}
        <div className="hidden lg:flex items-center border rounded-lg overflow-hidden">

          <input
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Enter VIN"
            className="px-3 py-2 text-sm outline-none w-40"
          />

          <button
            onClick={handleVinSearch}
            className="bg-black text-white px-3 py-2 text-sm"
          >
            Check
          </button>

        </div>

        {/* RIGHT BUTTONS */}
        <div className="flex items-center gap-3">

          <a
            href="tel:+19162618880"
            className="hidden md:block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Call Now
          </a>

          <Link
            href="/admin"
            className="hidden md:block border px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
          >
            Admin
          </Link>

        </div>

      </div>

    </header>
  );
}