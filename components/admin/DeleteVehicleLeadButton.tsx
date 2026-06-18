"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteVehicleLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function deleteLead() {
    if (!confirm("Move this lead to deleted?")) return;

    setLoading(true);

    const res = await fetch("/api/vehicle-leads/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Failed to delete lead");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={deleteLead}
      disabled={loading}
      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete Lead"}
    </button>
  );
}