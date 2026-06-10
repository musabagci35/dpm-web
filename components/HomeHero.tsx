"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const quickFilters = [
  { label: "Under $15k", query: "price=15000" },
  { label: "Low Mileage", query: "mileage=50000" },
  { label: "SUV", query: "body=SUV" },
  { label: "Sedan", query: "body=Sedan" },
];

export default function HomeHero() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const handleSearch = () => {
    const value = search.trim();
    if (!value) return;
    router.push(`/inventory?search=${encodeURIComponent(value)}`);
  };

  return (
    <section className="relative bg-gradient-to-b from-black via-gray-900 to-black text-white py-28">

      <div className="mx-auto max-w-6xl px-6 text-center">

        {/* TITLE */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Find Your Next Car
        </h1>

        <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
          Browse quality vehicles with transparent pricing and fast approvals.
        </p>

        {/* 🔥 SEARCH */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center relative">

          <input
            className="w-full sm:w-[420px] px-4 py-3 rounded-xl text-black outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Search make, model, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <button
            onClick={handleSearch}
            className="bg-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Search
          </button>

        </div>

        {/* 🔥 QUICK FILTERS (CARVANA FEEL) */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">

          {quickFilters.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(`/inventory?${item.query}`)}
              className="px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              {item.label}
            </button>
          ))}

        </div>

        {/* 🔥 CTA BUTTONS */}
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
            Get Approved
          </button>

        </div>

        {/* 🔥 TRUST (UPGRADED) */}
        <div className="mt-14 grid gap-6 md:grid-cols-3 text-sm text-gray-300">

          <div>
            <strong className="block text-white">
              ✔ Dealer Inspected
            </strong>
            Every vehicle checked before sale
          </div>

          <div>
            <strong className="block text-white">
              ✔ Easy Financing
            </strong>
            All credit types welcome
          </div>

          <div>
            <strong className="block text-white">
              ✔ No Hidden Fees
            </strong>
            Transparent pricing guaranteed
          </div>

        </div>

      </div>
    </section>
  );
}