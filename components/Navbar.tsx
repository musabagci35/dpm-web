
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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Drive Prime Motors"
            width={320}
            height={110}
            priority
            className="h-14 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-gray-800 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-red-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:+19162618880"
            className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-black text-gray-900 transition hover:border-red-600 hover:text-red-600"
          >
            (916) 261-8880
          </a>

          <Link
            href="/inventory"
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-red-700"
          >
            Shop Cars
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black text-gray-900 lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="border-t bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-2 px-6 py-5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 font-bold text-gray-900 hover:bg-gray-100"
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
