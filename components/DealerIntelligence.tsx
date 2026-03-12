"use client";

import { useState } from "react";

type AIData = {
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
};

export default function DealerIntelligence({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AIData | null>(null);

  async function runAI() {
    setLoading(true);

    const res = await fetch(`/api/admin/cars/${carId}/auction-ai`, {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result?.error || "AI failed");
      setLoading(false);
      return;
    }

    setData(result);
    setLoading(false);
  }

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Dealer Intelligence</div>
          <p className="text-sm text-gray-500">
            Auction value, buy limit and profit analysis
          </p>
        </div>

        <button
          onClick={runAI}
          disabled={loading}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run AI"}
        </button>
      </div>

      {!data && (
        <div className="mt-4 text-sm text-gray-500">
          Run AI to calculate auction value and profit margin.
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            <Stat
              label="Retail Price"
              value={`$${Number(data.pricing.retailPrice || 0).toLocaleString()}`}
            />

            <Stat
              label="Auction Value"
              value={`$${Number(data.pricing.estimatedAuctionValue || 0).toLocaleString()}`}
            />

            <Stat
              label="Buy Limit"
              value={`$${Number(data.pricing.buyLimit || 0).toLocaleString()}`}
            />

            <Stat
              label="Total Cost"
              value={`$${Number(data.pricing.totalCost || 0).toLocaleString()}`}
            />

            <Stat
              label="Expected Profit"
              value={`$${Number(data.pricing.expectedProfit || 0).toLocaleString()}`}
              color={
                data.pricing.expectedProfit > 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            />

            <Stat
              label="Risk Score"
              value={`${Number(data.decision.riskScore || 0)}/100`}
            />
          </div>

          <div className="mt-6 rounded-xl border bg-gray-50 p-4">
            <div className="text-xs text-gray-500">Recommendation</div>

            <div
              className={`mt-1 text-2xl font-bold ${
                data.decision.recommendation === "BUY"
                  ? "text-green-600"
                  : data.decision.recommendation === "MAYBE"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {data.decision.recommendation}
            </div>

            <div className="mt-3 space-y-1 text-sm text-gray-600">
              {data.decision.notes?.map((note, i) => (
                <div key={i}>• {note}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color = "",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}