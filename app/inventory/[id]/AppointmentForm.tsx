"use client";

import { useState } from "react";

export default function AppointmentForm({
  carId,
  carTitle,
}: {
  carId: string;
  carTitle: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const form = e.currentTarget;

    const data = {
      carId,
      carTitle,
      customerName: (
        form.elements.namedItem(
          "customerName"
        ) as HTMLInputElement
      ).value,

      phone: (
        form.elements.namedItem(
          "phone"
        ) as HTMLInputElement
      ).value,

      email: (
        form.elements.namedItem(
          "email"
        ) as HTMLInputElement
      ).value,

      appointmentDate: (
        form.elements.namedItem(
          "appointmentDate"
        ) as HTMLInputElement
      ).value,

      notes: (
        form.elements.namedItem(
          "notes"
        ) as HTMLTextAreaElement
      ).value,
    };

    const res = await fetch(
      "/api/appointments",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await res.json();

    setLoading(false);

    if (result.success) {
      alert(
        "Appointment scheduled ✅"
      );

      form.reset();
    } else {
      alert(
        result.error ||
          "Failed to book"
      );
    }
  }

  return (
    <div className="mt-6 rounded-2xl border p-5 bg-gray-50">

      <h3 className="text-lg font-bold">
        Schedule Test Drive
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Reserve this vehicle before it sells.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >

        <input
          name="customerName"
          placeholder="Full Name"
          className="w-full border rounded-xl p-3"
          required
        />

        <input
          name="phone"
          placeholder="Phone Number"
          className="w-full border rounded-xl p-3"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full border rounded-xl p-3"
        />

        <input
          name="appointmentDate"
          type="datetime-local"
          className="w-full border rounded-xl p-3"
          required
        />

        <textarea
          name="notes"
          placeholder="Notes"
          className="w-full border rounded-xl p-3"
          rows={3}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-black text-white py-3 font-semibold"
        >
          {loading
            ? "Scheduling..."
            : "Schedule Test Drive"}
        </button>

      </form>
    </div>
  );
}