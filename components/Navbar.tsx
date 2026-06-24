"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navItems = [
  { href: "/inventory", label: "Inventory" },
  { href: "/financing", label: "Financing" },
  { href: "/sell-your-car", label: "Sell Your Car" },
  { href: "/parts", label: "Parts" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 text-white shadow-xl">
      <div className="bg-gradient-to-r from-red-800 via-red-600 to-red-800 px-6 py-2 text-center text-xs font-black uppercase tracking-[0.25em] text-white">
        Drive Prime Motors • Sacramento Area Used Car Dealer
      </div>

      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
        <div className="px-1">
            <Image
              src="/logo-header.png"
              alt="Drive Prime Motors"
              width={500}
              height={160}
              priority
              className="h-20 w-auto object-contain md:h-24"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-black lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-3 text-zinc-200 transition hover:bg-red-600 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:+19162618880"
            className="rounded-2xl border border-red-500/50 bg-red-950 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-700 hover:text-white"
          >
            (916) 261-8880
          </a>

          <Link
            href="/inventory"
            className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-900/40 transition hover:bg-red-700"
          >
            Shop Cars
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className="h-1 bg-gradient-to-r from-red-950 via-red-500 to-red-950" />

      {open && (
        <div className="border-t border-white/10 bg-zinc-950 lg:hidden">
          <div className="mx-auto max-w-7xl space-y-2 px-6 py-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 font-black text-white hover:bg-red-600"
              >
                {item.label}
              </Link>
            ))}

            <a
              href="tel:+19162618880"
              className="block rounded-2xl bg-red-600 px-4 py-4 text-center font-black text-white"
            >
              Call (916) 261-8880
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
