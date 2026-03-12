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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await fetch("/api/vehicle-leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        carTitle,
      }),
    });

    alert("✅ Request Sent!");
    setForm({ name: "", email: "", phone: "" });
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="font-bold mb-4">Request Information</h3>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Full Name"
        className="w-full border p-3 mb-3 rounded-lg"
      />

      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="Phone"
        className="w-full border p-3 mb-3 rounded-lg"
      />

      <input
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="w-full border p-3 mb-3 rounded-lg"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white py-3 rounded-lg"
      >
        Send Request
      </button>
    </div>
  );
}