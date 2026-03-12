"use client";

import { useState } from "react";

type ScanResult = {
  pricing: {
    retailPrice: number;
    estimatedAuctionValue: number;
    buyLimit: number;
    totalCost: number;
    expectedProfit: number;
  };
  decision: {
    recommendation: string;
    riskScore: number;
    notes: string[];
  };
  vehicle: {
    year: number;
    make: string;
    model: string;
    vin: string;
    mileage: number;
  };
  source: string;
};

export default function LiveAuctionScanner({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScanResult | null>(null);

  async function runScanner() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/cars/${carId}/auction-ai`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result?.error || "Auction scan failed");
        setLoading(false);
        return;
      }

      setData(result);
    } catch (error) {
      alert("Auction scan failed");
    } finally {
      setLoading(false);
    }
  }

  const recommendationColor =
    data?.decision.recommendation === "BUY"
      ? "text-green-600"
      : data?.decision.recommendation === "MAYBE"
      ? "text-yellow-600"
      : "text-red-600";

  const profitColor =
    (data?.pricing.expectedProfit || 0) > 0
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Live Auction Scanner</div>
          <p className="text-sm text-gray-500">
            Scan this vehicle for auction value, buy limit, and margin.
          </p>
        </div>

        <button
          onClick={runScanner}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Scanning..." : "Run Scanner"}
        </button>
      </div>

      {!data && (
        <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          Run the scanner to generate a buy/skip recommendation.
        </div>
      )}

      {data && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Retail Price"
              value={`$${Number(data.pricing.retailPrice || 0).toLocaleString()}`}
            />
            <StatCard
              label="Auction Value"
              value={`$${Number(data.pricing.estimatedAuctionValue || 0).toLocaleString()}`}
            />
            <StatCard
              label="Buy Limit"
              value={`$${Number(data.pricing.buyLimit || 0).toLocaleString()}`}
            />
            <StatCard
              label="Expected Profit"
              value={`$${Number(data.pricing.expectedProfit || 0).toLocaleString()}`}
              valueClassName={profitColor}
            />
            <StatCard
              label="Risk Score"
              value={`${Number(data.decision.riskScore || 0)}/100`}
            />
          </div>

          <div className="mt-5 rounded-xl border bg-gray-50 p-4">
            <div className="text-xs text-gray-500">Recommendation</div>
            <div className={`mt-1 text-2xl font-bold ${recommendationColor}`}>
              {data.decision.recommendation}
            </div>

            <div className="mt-3 text-sm text-gray-700 space-y-1">
              {data.decision.notes?.map((note, idx) => (
                <div key={idx}>• {note}</div>
              ))}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Source: {data.source || "internal"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${valueClassName}`}>{value}</div>
    </div>
  );
}