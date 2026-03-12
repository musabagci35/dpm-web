"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RemoveCarButton({ carId }: { carId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    const ok = window.confirm("Are you sure you want to remove this car?");
    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/cars/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: carId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to remove car");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Remove failed:", error);
      alert("Something went wrong while removing the car.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-60"
    >
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}