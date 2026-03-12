"use client";

import { useState } from "react";

type AuctionData = {
  ok: boolean;
  source: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
    vin: string;
    mileage: number;
  };
  pricing: {
    retailPrice: number;
    estimatedAuctionValue: number;
    buyLimit: number;
    totalCost: number;
    expectedProfit: number;
  };
  decision: {
    recommendation: "BUY" | "MAYBE" | "SKIP" | string;
    riskScore: number;
    notes: string[];
  };
};

export default function AuctionPanel({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuctionData | null>(null);

  async function runAuctionAI() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/cars/${carId}/auction-ai`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result?.error || "Auction AI failed");
        setLoading(false);
        return;
      }

      setData(result);
    } catch (error) {
      alert("Auction AI failed");
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
    (data?.pricing.expectedProfit || 0) > 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="mt-6 rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Auction Scanner</div>
          <p className="mt-1 text-sm text-gray-600">
            Estimate auction value, buy limit, expected profit, and risk.
          </p>
        </div>

        <button
          onClick={runAuctionAI}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run Auction AI"}
        </button>
      </div>

      {!data && (
        <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          Run Auction AI to generate a buy/skip recommendation.
        </div>
      )}

      {data && (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Auction Value"
              value={`$${Number(data.pricing.estimatedAuctionValue || 0).toLocaleString()}`}
            />
            <StatCard
              label="Buy Limit"
              value={`$${Number(data.pricing.buyLimit || 0).toLocaleString()}`}
            />
            <StatCard
              label="Total Cost"
              value={`$${Number(data.pricing.totalCost || 0).toLocaleString()}`}
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

          <div className="mt-4 rounded-xl border bg-gray-50 p-4">
            <div className="text-xs text-gray-500">Recommendation</div>
            <div className={`mt-1 text-2xl font-bold ${recommendationColor}`}>
              {data.decision.recommendation}
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Source: {data.source === "fallback" ? "Internal estimate" : data.source}
            </div>

            {!!data.decision.notes?.length && (
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                {data.decision.notes.map((note, idx) => (
                  <div key={idx}>• {note}</div>
                ))}
              </div>
            )}
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