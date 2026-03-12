"use client";

import { useState } from "react";

export default function MakeOfferBox({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
    amount: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async () => {
    if (!form.buyerName || !form.buyerPhone || !form.amount) {
      alert("Name, phone, and offer amount are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          buyerName: form.buyerName,
          buyerPhone: form.buyerPhone,
          buyerEmail: form.buyerEmail,
          amount: Number(form.amount),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || "Something went wrong.");
        return;
      }

      alert("✅ Offer sent! We’ll contact you soon.");
      setForm({ buyerName: "", buyerPhone: "", buyerEmail: "", amount: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="text-lg font-semibold">Make an Offer</h3>
      <p className="mt-1 text-sm text-gray-600">
        Send your best offer — we’ll respond fast.
      </p>

      <div className="mt-4 grid gap-3">
        <input
          name="buyerName"
          value={form.buyerName}
          onChange={onChange}
          placeholder="Your name"
          className="rounded-xl border px-4 py-3 text-sm"
        />
        <input
          name="buyerPhone"
          value={form.buyerPhone}
          onChange={onChange}
          placeholder="Phone"
          className="rounded-xl border px-4 py-3 text-sm"
        />
        <input
          name="buyerEmail"
          value={form.buyerEmail}
          onChange={onChange}
          placeholder="Email (optional)"
          className="rounded-xl border px-4 py-3 text-sm"
        />
        <input
          name="amount"
          value={form.amount}
          onChange={onChange}
          placeholder="Offer amount (e.g. 17000)"
          className="rounded-xl border px-4 py-3 text-sm"
          inputMode="numeric"
        />

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="mt-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Submit Offer"}
        </button>

        <p className="text-xs text-gray-500">
          🔒 Your info is secure. No spam.
        </p>
      </div>
    </div>
  );
}