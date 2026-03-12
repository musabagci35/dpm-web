"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function parseSmartQuery(input: string) {
  const q = input.toLowerCase();

  // make detect (istersen artırırız)
  const makes = ["toyota", "honda", "ford", "bmw", "mercedes", "nissan", "tesla", "hyundai", "kia", "chevrolet"];
  const make = makes.find((m) => q.includes(m)) || "";

  // "under 10000" / "below 10000" / "max 10000" / "$10000"
  const priceMatch =
    q.match(/under\s*\$?\s*([0-9]{3,})/) ||
    q.match(/below\s*\$?\s*([0-9]{3,})/) ||
    q.match(/max\s*\$?\s*([0-9]{3,})/) ||
    q.match(/\$\s*([0-9]{3,})/);

  const maxPrice = priceMatch?.[1] || "";

  // "low miles" => 60000 default
  const maxMiles = q.includes("low miles") ? "60000" : "";

  // remaining free-text (model/year search için)
  return {
    qText: input.trim(),
    make: make ? make.charAt(0).toUpperCase() + make.slice(1) : "",
    maxPrice,
    maxMiles,
  };
}

export default function SmartSearch() {
  const router = useRouter();
  const sp = useSearchParams();

  const initial = sp.get("q") || "";
  const [text, setText] = useState(initial);

  const currentParams = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    return p;
  }, [sp]);

  const runSearch = () => {
    const parsed = parseSmartQuery(text);

    const params = new URLSearchParams(currentParams.toString());

    // always set q for regular search
    if (parsed.qText) params.set("q", parsed.qText);
    else params.delete("q");

    if (parsed.make) params.set("make", parsed.make);
    else params.delete("make");

    if (parsed.maxPrice) params.set("maxPrice", parsed.maxPrice);
    else params.delete("maxPrice");

    if (parsed.maxMiles) params.set("maxMiles", parsed.maxMiles);
    else params.delete("maxMiles");

    router.push(`/inventory?${params.toString()}`);
  };

  const clearAll = () => {
    setText("");
    router.push("/inventory");
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Smart search: "toyota under 10000 low miles"'
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={runSearch}
          className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Search
        </button>

        <button
          type="button"
          onClick={clearAll}
          className="rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}