"use client";

import { useEffect, useState } from "react";

type Lead = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  notes?: string;
  createdAt: string;
};

const statuses: Lead["status"][] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("load leads error:", error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function updateLead(id: string, patch: Partial<Lead>) {
    try {
      setSavingId(id);

      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      const updated = await res.json();

      if (!res.ok) {
        alert(updated.error || "Update failed");
        return;
      }

      setLeads((prev) =>
        prev.map((lead) => (lead._id === id ? { ...lead, ...updated } : lead))
      );
    } catch (error) {
      console.error("update lead error:", error);
      alert("Update failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="text-sm text-gray-500">Customer inquiries and follow-up pipeline</p>
      </div>

      {loading ? (
        <div className="p-6 border rounded-2xl bg-white">Loading...</div>
      ) : leads.length === 0 ? (
        <div className="p-6 border rounded-2xl bg-white">No leads yet.</div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead._id} className="border rounded-2xl bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{lead.name}</h2>
                  <p className="text-sm text-gray-600">{lead.phone}</p>
                  {lead.email ? <p className="text-sm text-gray-600">{lead.email}</p> : null}
                  <p className="text-sm text-gray-500">
                    Source: {lead.source} • {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateLead(lead._id, {
                        status: e.target.value as Lead["status"],
                      })
                    }
                    className="border rounded-xl px-3 py-2"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  {savingId === lead._id ? (
                    <span className="text-sm text-gray-500">Saving...</span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Message</p>
                <div className="min-h-[56px] rounded-xl border bg-gray-50 p-3 text-sm">
                  {lead.message || "No message"}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Notes</p>
                <textarea
                  defaultValue={lead.notes || ""}
                  onBlur={(e) =>
                    updateLead(lead._id, {
                      notes: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border p-3 text-sm min-h-[90px]"
                  placeholder="Add follow-up notes..."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}