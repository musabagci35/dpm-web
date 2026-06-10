"use client";

import { useState } from "react";

export default function LeadForm({ carId }: { carId: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/vehicle-leads", {
      method: "POST",
      body: JSON.stringify({ ...form, carId }),
    });

    if (res.ok) {
      alert("Message sent!");
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      alert("Error sending message");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border p-2"
      />

      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full border p-2"
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full border p-2"
      />

      <textarea
        placeholder="Message"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full border p-2"
      />

      <button className="bg-black text-white px-4 py-2">
        Send Inquiry
      </button>
    </form>
  );
}