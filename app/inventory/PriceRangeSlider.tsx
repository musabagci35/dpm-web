"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PriceRangeSlider({
  min = 0,
  max = 50000,
  step = 500,
}: {
  min?: number;
  max?: number;
  step?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [minPrice, setMinPrice] = useState<number>(Number(sp.get("minPrice") || min));
  const [maxPrice, setMaxPrice] = useState<number>(Number(sp.get("maxPrice") || max));

  // URL'deki parametreler değişirse state'i güncelle
  useEffect(() => {
    const m1 = Number(sp.get("minPrice") || min);
    const m2 = Number(sp.get("maxPrice") || max);
    setMinPrice(m1);
    setMaxPrice(m2);
  }, [sp, min, max]);

  const apply = () => {
    const params = new URLSearchParams(sp.toString());

    if (minPrice > min) params.set("minPrice", String(minPrice));
    else params.delete("minPrice");

    if (maxPrice < max) params.set("maxPrice", String(maxPrice));
    else params.delete("maxPrice");

    router.push(`/inventory?${params.toString()}`);
  };

  const clear = () => {
    const params = new URLSearchParams(sp.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    router.push(`/inventory?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        <span>Price Range</span>
        <span>
          ${minPrice.toLocaleString()} — ${maxPrice.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minPrice}
          onChange={(e) => setMinPrice(Number(e.target.value))}
          className="w-full"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full"
        />

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={clear}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}