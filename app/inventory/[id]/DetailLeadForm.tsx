"use client";

import { useState } from "react";

export default function DetailLeadForm({
  carTitle,
}: {
  carTitle: string;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      alert("Please enter name and phone");
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/vehicle-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          carTitle,
        }),
      });

      setSent(true);
      setForm({ name: "", email: "", phone: "" });

    } catch (err) {
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="mt-8 border rounded-2xl p-6 shadow-sm bg-white">

      {/* HEADER */}
      <h3 className="text-xl font-bold mb-2">
        Get This Car Today
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Fill out the form and our team will contact you within minutes.
      </p>

      {/* URGENCY */}
      <div className="text-xs text-red-600 font-semibold mb-4">
        🔥 High demand – limited availability
      </div>

      {/* SUCCESS */}
      {sent && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
          ✅ Request sent! We’ll contact you shortly.
        </div>
      )}

      {/* INPUTS */}
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full border p-3 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone Number"
        className="w-full border p-3 mb-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email (optional)"
        className="w-full border p-3 mb-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
      />

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
      >
        {loading ? "Sending..." : "Get Info & Price"}
      </button>

      {/* TRUST */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        No spam. No obligation.
      </p>

    </div>
  );
}