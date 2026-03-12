"use client";

import { useState } from "react";

export default function VINBrainPanel({ carId }: { carId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  async function runVINBrain() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/cars/${carId}/vin-brain`, {
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result?.error || "VIN Brain failed");
        setLoading(false);
        return;
      }

      setData(result);
    } catch (error) {
      alert("VIN Brain failed");
    } finally {
      setLoading(false);
    }
  }

  const verdictColor =
    data?.verdict === "CLEAN"
      ? "text-green-600"
      : data?.verdict === "REVIEW"
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="mt-6 rounded-2xl border bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">VIN Brain</div>
          <p className="text-sm text-gray-500">
            Title status, salvage/flood/junk checks, and accident review.
          </p>
        </div>

        <button
          onClick={runVINBrain}
          disabled={loading}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Run VIN Brain"}
        </button>
      </div>

      {!data && (
        <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          Run VIN Brain to check title and vehicle history risk.
        </div>
      )}

      {data && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Title Status" value={String(data.titleStatus || "unknown")} />
            <StatCard label="Accidents" value={String(data.accidentCount || 0)} />
            <StatCard label="Verdict" value={String(data.verdict || "CHECK")} valueClassName={verdictColor} />
            <StatCard label="VIN" value={String(data.vin || "")} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Flag ok={!!data.flags?.cleanTitle} label="Clean Title" positive />
            <Flag ok={!!data.flags?.salvage} label="Salvage" />
            <Flag ok={!!data.flags?.flood} label="Flood" />
            <Flag ok={!!data.flags?.junk} label="Junk / Scrap" />
            <Flag ok={!!data.flags?.rebuilt} label="Rebuilt" />
            <Flag ok={!!data.flags?.odometerIssue} label="Odometer Issue" />
          </div>

          {!!data.brands?.length && (
            <div className="mt-5 rounded-xl border bg-gray-50 p-4">
              <div className="text-sm font-semibold">Title / Brand Notes</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.brands.map((brand: string, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-full border px-3 py-1 text-xs bg-white"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-bold break-words ${valueClassName}`}>{value}</div>
    </div>
  );
}

function Flag({
  ok,
  label,
  positive = false,
}: {
  ok: boolean;
  label: string;
  positive?: boolean;
}) {
  const activeClass = positive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";

  const inactiveClass = "border-gray-200 bg-gray-50 text-gray-500";

  return (
    <div className={`rounded-xl border p-3 text-sm ${ok ? activeClass : inactiveClass}`}>
      <span className="font-medium">{label}</span>: {ok ? "Yes" : "No"}
    </div>
  );
}