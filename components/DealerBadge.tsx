"use client";

import { useEffect, useState } from "react";

type AuctionAI = {
  pricing?: {
    expectedProfit?: number;
  };
};

export default function DealerBadge({ carId }: { carId: string }) {
  const [data, setData] = useState<AuctionAI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/admin/cars/${carId}/auction-ai`);
        const result = await res.json();

        if (res.ok) {
          setData(result);
        }
      } catch (err) {
        console.error("Auction AI fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [carId]);

  if (loading) return null;
  if (!data) return null;

  const profit = data?.pricing?.expectedProfit ?? 0;

  return (
    <div className="mt-2 text-sm">

      {profit > 2500 && (
        <div className="text-green-600 font-semibold">
          🔥 BUY — Profit ${profit.toLocaleString()}
        </div>
      )}

      {profit > 0 && profit <= 2500 && (
        <div className="text-yellow-600 font-semibold">
          ⚠ MAYBE — Profit ${profit.toLocaleString()}
        </div>
      )}

      {profit <= 0 && (
        <div className="text-red-600 font-semibold">
          ✖ SKIP
        </div>
      )}

    </div>
  );
}