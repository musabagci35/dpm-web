"use client";

import { useState } from "react";

export default function CarLeadForm({ car }: any) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/leads", { // ✅ FIX
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        message: `Interested in ${car.year} ${car.make} ${car.model}`,
        carId: car._id,
        source: "inventory",
      }),
    }); // ✅ FIX (kapanış eklendi)

    if (res.ok) {
      setSuccess(true);
      setForm({ name: "", phone: "" });
    }

    setLoading(false);
  }

  return (
    <div className="mt-6">

      <h3 className="font-bold mb-3">Get This Car</h3>

      {success && (
        <div className="text-green-600 mb-3">
          We’ll contact you shortly!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded p-3"
          required
        />

        <input
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded p-3"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          {loading ? "Sending..." : "Submit Lead"}
        </button>

      </form>
    </div>
  );
}