"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomeHero() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    const value = search.trim();
    if (!value) return;

    router.push(`/inventory?search=${encodeURIComponent(value)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative bg-gradient-to-b from-black via-gray-900 to-black text-white py-28">

      <div className="mx-auto max-w-6xl px-6 text-center">

        {/* TITLE */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Find Your Next Car
        </h1>

        <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
          Browse quality used vehicles at Drive Prime Motors LLC.
          Fast financing approvals and transparent pricing.
        </p>

        {/* SEARCH BAR */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">

          <input
            className="w-full sm:w-[420px] px-4 py-3 rounded-xl text-black outline-none"
            placeholder="Search make, model, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSearch}
            className="bg-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Search
          </button>

        </div>

        {/* CTA BUTTONS */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">

          <button
            onClick={() => router.push("/inventory")}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
          >
            Browse Inventory
          </button>

          <button
            onClick={() => router.push("/financing")}
            className="border border-white/40 px-6 py-3 rounded-xl font-semibold hover:bg-white/10"
          >
            Apply for Financing
          </button>

        </div>

        {/* TRUST BADGES */}
        <div className="mt-14 grid gap-6 md:grid-cols-3 text-sm text-gray-300">

          <div>
            <strong className="block text-white">
              Dealer Inspected
            </strong>
            Quality vehicles inspected before sale
          </div>

          <div>
            <strong className="block text-white">
              Easy Financing
            </strong>
            Multiple lenders for all credit types
          </div>

          <div>
            <strong className="block text-white">
              Transparent Pricing
            </strong>
            No hidden fees or surprises
          </div>

        </div>

      </div>

    </section>
  );
}