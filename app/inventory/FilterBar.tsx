"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FilterBar({ makes }: { makes: string[] }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [sort, setSort] = useState("");

  const applyFilters = () => {
    let query = "/inventory?";

    if (make) query += `make=${make}&`;
    if (sort) query += `sort=${sort}`;

    router.push(query);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-10 justify-center">
      <select
        value={make}
        onChange={(e) => setMake(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option value="">All Makes</option>
        {makes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="border rounded-lg px-4 py-2"
      >
        <option value="">Newest</option>
        <option value="price_asc">Price Low → High</option>
        <option value="price_desc">Price High → Low</option>
      </select>

      <button
        onClick={applyFilters}
        className="bg-black text-white px-4 py-2 rounded-lg"
      >
        Apply
      </button>
    </div>
  );
}