"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AISearch() {

  const [query, setQuery] = useState("");
  const router = useRouter();

  async function handleSearch() {

    if (!query) return;

    const res = await fetch("/api/ai-search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    if (data.cars.length > 0) {
      router.push(`/inventory/${data.cars[0]._id}`);
    } else {
      alert("No vehicles found");
    }

  }

  return (
    <div className="flex gap-2">

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try: family car under 20k"
        className="w-full rounded-xl border px-4 py-3"
      />

      <button
        onClick={handleSearch}
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        AI Search
      </button>

    </div>
  );

}