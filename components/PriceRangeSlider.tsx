"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function PriceRangeSlider() {
  const router = useRouter();
  const params = useSearchParams();

  const [price, setPrice] = useState(Number(params.get("price") || 50000));

  const handleChange = (e: any) => {
    const value = e.target.value;
    setPrice(value);

    const query = new URLSearchParams(params.toString());
    query.set("price", value);

    router.push(`/inventory?${query.toString()}`);
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">

      <h3 className="font-semibold mb-4">
        Max Price: ${Number(price).toLocaleString()}
      </h3>

      <input
        type="range"
        min="1000"
        max="100000"
        step="500"
        value={price}
        onChange={handleChange}
        className="w-full"
      />

    </div>
  );
}