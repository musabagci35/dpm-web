"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VINProPanel() {
  const [vin, setVin] = useState("");
  const router = useRouter();

  function goToVinPage() {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length < 6) return;
    router.push(`/vin/${cleanVin}`);
  }

  function openLink(type: "bidfax" | "statvin" | "poctra" | "copart") {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length < 6) return;

    const map = {
      bidfax: `https://bidfax.info/search?q=${encodeURIComponent(cleanVin)}`,
      statvin: `https://stat.vin/cars/${encodeURIComponent(cleanVin)}`,
      poctra: `https://poctra.com/search?query=${encodeURIComponent(cleanVin)}`,
      copart: `https://www.copart.com/lotSearchResults?free=true&query=${encodeURIComponent(cleanVin)}`,
    };

    window.open(map[type], "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="text-2xl font-bold">Check Vehicle History</div>

      <div className="flex gap-3">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          placeholder="Enter VIN (17 characters)"
          className="w-full rounded-lg border px-4 py-3 outline-none"
        />

        <button
          onClick={goToVinPage}
          className="rounded-lg bg-black px-6 text-white"
        >
          Scan VIN
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <button
          onClick={() => openLink("bidfax")}
          className="rounded-lg border p-3 text-left hover:bg-gray-50"
        >
          Bidfax Photos
        </button>

        <button
          onClick={() => openLink("statvin")}
          className="rounded-lg border p-3 text-left hover:bg-gray-50"
        >
          Stat.vin Records
        </button>

        <button
          onClick={() => openLink("poctra")}
          className="rounded-lg border p-3 text-left hover:bg-gray-50"
        >
          Poctra Search
        </button>

        <button
          onClick={() => openLink("copart")}
          className="rounded-lg border p-3 text-left hover:bg-gray-50"
        >
          Copart Search
        </button>
      </div>
    </div>
  );
}