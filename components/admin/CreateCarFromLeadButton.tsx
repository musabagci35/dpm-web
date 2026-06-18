"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateCarFromLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function createCar() {
    if (!confirm("Create inventory vehicle from this lead?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/vehicle-leads/create-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to create vehicle");
        return;
      }

      alert("Vehicle created in inventory.");
      router.refresh();

      if (data.slug) {
        window.open(`/inventory/${data.slug}`, "_blank");
      }
    } catch (error) {
      alert("Error creating vehicle.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={createCar}
      disabled={loading}
      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Creating..." : "Create Inventory Vehicle"}
    </button>
  );
}