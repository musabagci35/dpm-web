"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLink =
    "transition hover:text-red-600";

  const mobileLink =
    "rounded-lg px-3 py-2 hover:bg-gray-100";

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-8">
      <Link
  href="/"
  className="flex items-center"
>
  <Image
    src="/logo.png"
    alt="Drive Prime Motors"
    width={320}
    height={110}
    priority
    className="h-14 w-auto"
  />
</Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/inventory" className={navLink}>Inventory</Link>
          <Link href="/parts" className={navLink}>Parts</Link>
          <Link href="/marketplace" className={navLink}>Marketplace</Link>
          <Link href="/vin-report" className={navLink}>VIN Report</Link>
          <Link href="/sell-your-car" className={navLink}>Sell Your Car</Link>
          <Link href="/financing" className={navLink}>Financing</Link>
          <Link href="/contact" className={navLink}>Contact</Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/admin"
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-gray-100"
          >
            Admin
          </Link>

          <a
            href="tel:+19162618880"
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Call Now
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-xl border px-3 py-2 text-sm font-semibold md:hidden"
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="border-t bg-white md:hidden">
         <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            <Link href="/inventory" onClick={() => setOpen(false)} className={mobileLink}>Inventory</Link>
            <Link href="/parts" onClick={() => setOpen(false)} className={mobileLink}>Parts</Link>
            <Link href="/marketplace" onClick={() => setOpen(false)} className={mobileLink}>Marketplace</Link>
            <Link href="/vin-report" onClick={() => setOpen(false)} className={mobileLink}>VIN Report</Link>
            <Link href="/sell-your-car" onClick={() => setOpen(false)} className={mobileLink}>Sell Your Car</Link>
            <Link href="/financing" onClick={() => setOpen(false)} className={mobileLink}>Financing</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className={mobileLink}>Contact</Link>
            <Link href="/admin" onClick={() => setOpen(false)} className={mobileLink}>Admin</Link>

            <a
              href="tel:+19162618880"
              className="mt-2 rounded-xl bg-red-600 px-4 py-3 text-center font-semibold text-white"
            >
              Call Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}