"use client";

import PriceRangeSlider from "./PriceRangeSlider";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function InventoryFilter() {
  const router = useRouter();
  const params = useSearchParams();

  const [make, setMake] = useState(params.get("make") || "");
  const [model, setModel] = useState(params.get("model") || "");
  const [price, setPrice] = useState(params.get("price") || "");
  const [year, setYear] = useState(params.get("year") || "");
  const [mileage, setMileage] = useState(params.get("mileage") || "");

  const applyFilters = () => {
    const query = new URLSearchParams();

    if (make) query.set("make", make);
    if (model) query.set("model", model);
    if (price) query.set("price", price);
    if (year) query.set("year", year);
    if (mileage) query.set("mileage", mileage);

    router.push(`/inventory?${query.toString()}`);
  };

  const clearFilters = () => {
    router.push("/inventory");
  };

  return (
    <div className="mb-10">

      {/* TOP BAR */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">

        <h2 className="text-xl font-bold">
          Find Your Car
        </h2>

        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:underline"
        >
          Clear Filters
        </button>

      </div>

      {/* FILTER BOX */}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">

        <div className="grid gap-4 md:grid-cols-6">

          {/* MAKE */}
          <input
            placeholder="Make (Toyota, BMW...)"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* MODEL */}
          <input
            placeholder="Model (Camry, X5...)"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* PRICE */}
          <input
            placeholder="Max Price ($)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* YEAR */}
          <input
            placeholder="Min Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* MILEAGE */}
          <input
            placeholder="Max Mileage"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />

          {/* APPLY BUTTON */}
          <button
            onClick={applyFilters}
            className="bg-black text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition"
          >
            Search
          </button>

        </div>

        {/* SLIDER (BONUS UX) */}
        <div className="mt-6">
          <PriceRangeSlider />
        </div>

      </div>

    </div>
  );
}