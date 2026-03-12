"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEALER_ID = "69ab61daaef42746175b0a9b";

export default function AddCarPage() {
  const router = useRouter();
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function importVin() {
    const clean = vin.trim().toUpperCase();

    if (!clean) {
      setMsg("Please enter a VIN.");
      return;
    }

    if (clean.length !== 17) {
      setMsg("VIN must be 17 characters.");
      return;
    }

    try {
      setLoading(true);
      setMsg(null);

      const res = await fetch("/api/admin/cars/import-vin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: clean,
          dealerId: DEALER_ID,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Import failed");
        return;
      }

      router.push(`/admin/edit-car/${data.carId}`);
    } catch (error) {
      console.error("VIN import request failed:", error);
      setMsg("Something went wrong while importing the VIN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">Import Vehicle by VIN</h1>
      <p className="mt-2 text-gray-600">
        Enter a VIN to automatically create a draft vehicle listing.
        You will be redirected to the edit page to complete the details.
      </p>

      <div className="mt-8 flex gap-3">
        <input
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          placeholder="Enter 17-digit VIN"
          className="flex-1 rounded-xl border px-4 py-3"
        />
        <button
          onClick={importVin}
          disabled={loading}
          className="rounded-xl bg-black px-6 py-3 text-white disabled:opacity-60"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>

      {msg && (
        <div className="mt-4 rounded-xl border bg-white p-4 text-sm text-red-600">
          {msg}
        </div>
      )}
    </div>
  );
}