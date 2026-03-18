"use client";

import { useState } from "react";

type Props = {
  source?: "website" | "inventory" | "vin" | "financing" | "manual";
  vehicleId?: string | null;
  title?: string;
};

export default function LeadForm({
  source = "website",
  vehicleId = null,
  title = "Get in Touch",
}: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.phone) {
      alert("Name and phone are required");
      return;
    }

    try {
      setSending(true);
      setDone(false);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          source,
          carId: vehicleId, // ✅ FIX (backend ile uyumlu)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send");
        return;
      }

      // ✅ SUCCESS
      setDone(true);

      setForm({
        name: "",
        phone: "",
        email: "",
        message: "",
      });

    } catch (error) {
      console.error("lead submit error:", error);
      alert("Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Leave your info and we’ll contact you ASAP.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">

        <input
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="w-full rounded-xl border p-3"
          placeholder="Full name"
          required
        />

        <input
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          className="w-full rounded-xl border p-3"
          placeholder="Phone number"
          required
        />

        <input
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full rounded-xl border p-3"
          placeholder="Email address"
        />

        <textarea
          value={form.message}
          onChange={(e) =>
            setForm({ ...form, message: e.target.value })
          }
          className="w-full rounded-xl border p-3 min-h-[110px]"
          placeholder="Message"
        />
window.open(
  `https://wa.me/1YOURNUMBER?text=New lead: ${form.name} ${form.phone}`,
  "_blank"
);
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending..." : "Submit Lead"}
        </button>

        {done && (
          <p className="text-sm text-green-600">
            ✅ Lead submitted successfully!
          </p>
        )}
      </form>
    </div>
  );
}