"use client";

import { useState } from "react";

export default function VehicleLeadForm({
  car,
}: {
  car: { id?: string; title: string };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/vehicle-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          carTitle: car.title,
          name,
          email,
          phone,
          status: "New",
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      setName("");
      setEmail("");
      setPhone("");
      setMsg("✅ Sent! We will contact you shortly.");
    } catch (err) {
      setMsg("❌ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <input
        className="w-full border rounded-xl px-3 py-2"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        className="w-full border rounded-xl px-3 py-2"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        className="w-full border rounded-xl px-3 py-2"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />

      <button
        className="w-full bg-black text-white rounded-xl py-2 font-semibold"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send"}
      </button>

      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}