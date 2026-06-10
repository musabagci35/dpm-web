"use client";

import { useState } from "react";

export default function OfferActions({
  offerId,
  status,
}: {
  offerId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);

  const patch = async (action: "accept" | "reject" | "counter", counterAmount?: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, counterAmount }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "Failed");
        return;
      }

      // refresh page
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const counter = async () => {
    const val = prompt("Counter offer amount? (e.g. 18500)");
    if (!val) return;
    const num = Number(val);
    if (!num || isNaN(num)) return alert("Invalid amount");
    await patch("counter", num);
  };

  return (
    <div className="flex gap-2">
      <button
        disabled={loading || status === "accepted"}
        onClick={() => patch("accept")}
        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Accept
      </button>

      <button
        disabled={loading || status === "rejected"}
        onClick={() => patch("reject")}
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Reject
      </button>

      <button
        disabled={loading}
        onClick={counter}
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        Counter
      </button>
    </div>
  );
}