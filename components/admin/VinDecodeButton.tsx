"use client";

import { useState } from "react";
import { Loader2, ScanLine } from "lucide-react";

export type DecodedVinData = {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  body?: string;
  engine?: string;
  transmission?: string;
  fuel?: string;
  driveType?: string;
  manufacturer?: string;
  plantCountry?: string;
  plantState?: string;
  plantCity?: string;
  hasData?: boolean;
  source?: string;
  decodedAt?: string;
  cached?: boolean;
};

export default function VinDecodeButton({
  vin,
  onDecoded,
  className = "",
}: {
  vin: string;
  onDecoded: (data: DecodedVinData) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    const clean = vin.trim().toUpperCase();
    setError("");

    if (clean.length !== 17) {
      setError("Enter a valid 17-character VIN first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/vin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: clean }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "VIN decode failed. Please try again.");
        return;
      }

      if (!data.hasData) {
        setError("No decoded data is available for this VIN.");
        return;
      }

      onDecoded(data);
    } catch {
      setError("VIN decode failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ScanLine className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? "Decoding…" : "Decode VIN"}
      </button>

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
