"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  carId: string;
  status: string;
  isFeatured: boolean;
};

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
];

export default function VehicleStatusMenu({ carId, status, isFeatured }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function updateStatus(next: string) {
    if (next === status) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Failed to update vehicle status");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeatured() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Failed to update featured status");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle() {
    const ok = confirm(
      "Permanently delete this vehicle record? This cannot be undone."
    );
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/cars/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: carId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 sm:w-44">
      <label className="sr-only" htmlFor={`status-${carId}`}>
        Vehicle status
      </label>
      <select
        id={`status-${carId}`}
        value={status}
        disabled={saving}
        onChange={(e) => updateStatus(e.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleFeatured}
        disabled={saving}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-60 ${
          isFeatured ? "border-blue-600 bg-blue-50 text-blue-700" : ""
        }`}
      >
        {isFeatured ? "★ Featured" : "☆ Mark Featured"}
      </button>

      <button
        type="button"
        onClick={deleteVehicle}
        disabled={saving}
        className="w-full rounded-xl border border-red-300 px-3 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
