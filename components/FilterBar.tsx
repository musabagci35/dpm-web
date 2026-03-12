"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FilterBar() {

  const router = useRouter();

  const [make, setMake] = useState("");
  const [price, setPrice] = useState("");

  const handleFilter = () => {

    const params = new URLSearchParams();

    if (make) params.set("make", make);
    if (price) params.set("maxPrice", price);

    router.push(`/inventory?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 flex-wrap">

      <input
        className="border px-4 py-2 rounded-lg"
        placeholder="Make (Toyota, Ford...)"
        value={make}
        onChange={(e) => setMake(e.target.value)}
      />

      <input
        className="border px-4 py-2 rounded-lg"
        placeholder="Max Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button
        onClick={handleFilter}
        className="bg-black text-white px-6 py-2 rounded-lg"
      >
        Filter
      </button>

    </div>
  );
}