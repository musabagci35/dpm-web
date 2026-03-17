"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VinScannerPro() {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanVin = vin.trim().toUpperCase();

    if (cleanVin.length < 11) {
      alert("Invalid VIN");
      return;
    }

    setLoading(true);

    try {
      // pre-scan check
      await fetch(`/api/vin-intelligence?vin=${cleanVin}`);

      router.push(`/vin/${cleanVin}`);
    } catch (err) {
      console.error(err);
      router.push(`/vin/${cleanVin}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
    >
      <input
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        placeholder="Enter VIN"
        className="w-64 border px-3 py-2 rounded"
      />

      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded"
      >
        {loading ? "Scanning..." : "Check"}
      </button>
    </form>
  );
}