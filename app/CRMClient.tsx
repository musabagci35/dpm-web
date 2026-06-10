"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  _id: string;
  name?: string;
  fullName?: string;
  buyerName?: string;
  email?: string;
  phone?: string;
  buyerPhone?: string;
  message?: string;
  notes?: string;
  status?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  vehicleInterest?: string;
  carTitle?: string;
  budget?: number | string;
};

const STATUS_OPTIONS = ["new", "hot", "warm", "cold", "won", "lost"];

function normalizeLead(raw: any): Lead {
  return {
    _id: String(raw._id || ""),
    name: raw.name || raw.fullName || raw.buyerName || "",
    email: raw.email || raw.buyerEmail || "",
    phone: raw.phone || raw.buyerPhone || "",
    message: raw.message || raw.notes || "",
    status: (raw.status || "new").toLowerCase(),
    source: raw.source || "website",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    vehicleInterest:
      raw.vehicleInterest ||
      raw.carTitle ||
      raw.vehicle ||
      raw.interestedVehicle ||
      "",
    budget: raw.budget || raw.offerAmount || "",
  };
}

function badgeClass(status: string) {
  switch (status) {
    case "hot":
      return "bg-red-100 text-red-700";
    case "warm":
      return "bg-orange-100 text-orange-700";
    case "cold":
      return "bg-blue-100 text-blue-700";
    case "won":
      return "bg-green-100 text-green-700";
    case "lost":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

export default function CRMClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.leads) ? data.leads : [];
      setLeads(rows.map(normalizeLead));
    } catch (error) {
      console.error("Failed to load leads", error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((lead) => {
      if (lead.source) set.add(lead.source);
    });
    return ["all", ...Array.from(set)];
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lead.name?.toLowerCase().includes(q) ||
        lead.email?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        lead.vehicleInterest?.toLowerCase().includes(q) ||
        lead.message?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || (lead.status || "new") === statusFilter;

      const matchesSource =
        sourceFilter === "all" || (lead.source || "website") === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((x) => x.status === "hot").length;
    const warm = leads.filter((x) => x.status === "warm").length;
    const newCount = leads.filter((x) => x.status === "new").length;
    const won = leads.filter((x) => x.status === "won").length;

    return { total, hot, warm, newCount, won };
  }, [leads]);

  async function updateLeadStatus(id: string, status: string) {
    setSavingId(id);

    const previous = leads;
    setLeads((curr) =>
      curr.map((lead) => (lead._id === id ? { ...lead, status } : lead))
    );

    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update lead");
      }
    } catch (error) {
      console.error(error);
      setLeads(previous);
      alert("Lead status update failed.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="mt-2 text-3xl font-bold">{stats.total}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">New</p>
          <p className="mt-2 text-3xl font-bold">{stats.newCount}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Hot</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats.hot}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Warm</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">{stats.warm}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Won</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.won}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, vehicle..."
            className="rounded-xl border px-4 py-2 outline-none ring-0 focus:border-black"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border px-4 py-2 outline-none focus:border-black"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status[0].toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border px-4 py-2 outline-none focus:border-black"
          >
            {sources.map((source) => (
              <option key={source} value={source}>
                {source === "all" ? "All Sources" : source}
              </option>
            ))}
          </select>

          <button
            onClick={loadLeads}
            className="rounded-xl bg-black px-4 py-2 font-semibold text-white hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-gray-500">Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-gray-500">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-4 font-semibold">Lead</th>
                  <th className="px-4 py-4 font-semibold">Vehicle</th>
                  <th className="px-4 py-4 font-semibold">Source</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Created</th>
                  <th className="px-4 py-4 font-semibold">Notes</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead._id} className="border-t align-top">
                    <td className="px-4 py-4">
                      <div className="font-semibold">{lead.name || "Unknown"}</div>
                      <div className="text-gray-600">{lead.phone || "No phone"}</div>
                      <div className="text-gray-500">{lead.email || "No email"}</div>
                      {lead.budget ? (
                        <div className="mt-1 text-xs text-gray-500">
                          Budget: ${Number(lead.budget).toLocaleString()}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {lead.vehicleInterest || "General inquiry"}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {lead.source || "website"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                            lead.status || "new"
                          )}`}
                        >
                          {lead.status || "new"}
                        </span>

                        <select
                          value={lead.status || "new"}
                          disabled={savingId === lead._id}
                          onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                          className="rounded-lg border px-3 py-2 text-xs"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-4 py-4 text-gray-600 max-w-xs">
                      <div className="line-clamp-3">
                        {lead.message || "No notes"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}