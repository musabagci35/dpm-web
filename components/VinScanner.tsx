"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VinScanner() {
  const [vin, setVin] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!vin || vin.length < 5) return;

    const cleanVin = vin.trim().toUpperCase();

    router.push(`/vin/${cleanVin}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center"
    >
      <input
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        placeholder="Enter VIN"
        className="w-56 border px-3 py-2 outline-none"
      />

      <button
        type="submit"
        className="bg-black px-4 py-2 text-white"
      >
        Check
      </button>
    </form>
  );
}