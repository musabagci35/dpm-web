"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_DEALER_ID = "69ab61daaef42746175b0a9b"

export default function AdminQuickActions() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);

  async function importVin() {
    const cleanVin = vin.trim().toUpperCase();
    if (!cleanVin) return alert("Enter a VIN");

    setLoading(true);

    const res = await fetch("/api/admin/cars/import-vin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vin: cleanVin,
        dealerId: "69ab61daaef42746175b0a9b"
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "VIN import failed");
      setLoading(false);
      return;
    }

    router.push(`/admin/edit-car/${data.carId}`);
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-lg font-semibold">Quick Actions</div>

      <div className="mt-4 flex gap-2">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="Enter VIN"
          className="w-full rounded-xl border px-4 py-3"
        />
        <button
          onClick={importVin}
          disabled={loading}
          className="rounded-xl bg-black px-5 py-3 text-white"
        >
          {loading ? "Importing..." : "Import VIN"}
        </button>
      </div>
    </div>
  );
}