"use client";

import { useState } from "react";

export default function DealerBrainPro({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  async function runBrain() {
    setLoading(true);

    const res = await fetch(`/api/admin/cars/${carId}/dealer-brain-pro`, {
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result?.error || "Dealer Brain PRO failed");
      setLoading(false);
      return;
    }

    setData(result);
    setLoading(false);
  }

  const recColor =
    data?.decision?.recommendation === "BUY"
      ? "text-green-600"
      : data?.decision?.recommendation === "MAYBE"
      ? "text-yellow-600"
      : "text-red-600";

  const profitColor =
    (data?.pricing?.expectedProfit || 0) > 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Dealer Brain PRO</div>
          <p className="text-sm text-gray-500">
            Title risk, auction value, margin analysis, and buy/avoid signal.
          </p>
        </div>

        <button
          onClick={runBrain}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run Brain PRO"}
        </button>
      </div>

      {!data && (
        <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          Run Brain PRO to generate a full dealer decision analysis.
        </div>
      )}

      {data && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Retail Price" value={`$${Number(data.pricing.retailPrice || 0).toLocaleString()}`} />
            <Card label="Auction Value" value={`$${Number(data.pricing.estimatedAuctionValue || 0).toLocaleString()}`} />
            <Card label="Buy Limit" value={`$${Number(data.pricing.buyLimit || 0).toLocaleString()}`} />
            <Card label="Total Cost" value={`$${Number(data.pricing.totalCost || 0).toLocaleString()}`} />
            <Card
              label="Expected Profit"
              value={`$${Number(data.pricing.expectedProfit || 0).toLocaleString()}`}
              color={profitColor}
            />
            <Card label="Risk Score" value={`${Number(data.decision.riskScore || 0)}/100`} />
            <Card label="Title Status" value={String(data.title.status || "unknown")} />
            <Card label="Accidents" value={String(data.title.accidentCount || 0)} />
          </div>

          <div className="mt-5 rounded-xl border bg-gray-50 p-4">
            <div className="text-xs text-gray-500">Recommendation</div>
            <div className={`mt-1 text-2xl font-bold ${recColor}`}>
              {data.decision.recommendation}
            </div>

            <div className="mt-3 space-y-1 text-sm text-gray-700">
              {data.decision.notes?.map((note: string, idx: number) => (
                <div key={idx}>• {note}</div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({
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
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}