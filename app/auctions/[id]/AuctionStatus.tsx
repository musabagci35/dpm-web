"use client";

import { useEffect, useState } from "react";

const ENDING_SOON_MS = 60 * 60 * 1000; // 1 hour

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Ended";
  const minutes = Math.floor(ms / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  scheduled: "Upcoming",
  sold: "Sold",
  reserve_not_met: "Reserve Not Met",
  ended: "Ended",
};

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-600",
  ending_soon: "bg-red-600",
  scheduled: "bg-blue-600",
  sold: "bg-gray-900",
  reserve_not_met: "bg-amber-600",
  ended: "bg-gray-500",
};

/**
 * Ticks client-side once a second while the auction is live — the server
 * only ever knows `endsAt` and the status at render time, so "Ending Soon"
 * and the live countdown both have to be computed here, in the browser,
 * against the visitor's own clock.
 */
export default function AuctionStatus({ status, endsAt }: { status: string; endsAt: string | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    if (status !== "live" || !endsAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status, endsAt]);

  if (status !== "live" || !endsAt) {
    return (
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-black text-white ${STATUS_COLORS[status] || "bg-gray-500"}`}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  }

  const remainingMs = now != null ? new Date(endsAt).getTime() - now : new Date(endsAt).getTime() - Date.now();
  const isEndingSoon = remainingMs > 0 && remainingMs <= ENDING_SOON_MS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-black text-white ${
          isEndingSoon ? STATUS_COLORS.ending_soon : STATUS_COLORS.live
        }`}
      >
        {isEndingSoon ? "Ending Soon" : "Live"}
      </span>
      <span className="text-sm font-bold text-gray-700">
        {remainingMs > 0 ? `${formatRemaining(remainingMs)} left` : "Ended"}
      </span>
    </div>
  );
}
