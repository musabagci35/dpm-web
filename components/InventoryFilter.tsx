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
    <div className="bg-white border rounded-xl p-6 mb-10 shadow-sm">

      <div className="grid gap-4 md:grid-cols-6">

        {/* MAKE */}
        <input
          placeholder="Make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {/* MODEL */}
        <input
          placeholder="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {/* PRICE */}
        <input
          placeholder="Max Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {/* YEAR */}
        <input
          placeholder="Min Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {/* MILEAGE */}
        <input
          placeholder="Max Mileage"
          value={mileage}
          onChange={(e) => setMileage(e.target.value)}
          className="border rounded px-3 py-2"
        />

        {/* BUTTON */}
        <button
          onClick={applyFilters}
          className="bg-black text-white rounded px-4 py-2 hover:bg-gray-900"
        >
          Apply
        </button>

      </div>

      <div className="mt-4">
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:underline"
        >
          Clear Filters
        </button>
      </div>

    </div>
  );
}