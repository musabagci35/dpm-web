"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: string;
  priority?: "cold" | "warm" | "hot";
  status:
    | "new"
    | "contacted"
    | "appointment"
    | "qualified"
    | "won"
    | "lost";
  notes?: string;
  createdAt: string;
};

const columns: Lead["status"][] = [
  "new",
  "contacted",
  "appointment",
  "qualified",
  "won",
  "lost",
];

function priorityColor(priority?: string) {
  if (priority === "hot") return "bg-red-100 text-red-700";
  if (priority === "warm") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

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
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      const updated = await res.json();

      if (!res.ok) {
        alert(updated.error || "Update failed");
        return;
      }

      setLeads((prev) =>
        prev.map((lead) =>
          lead._id === id ? { ...lead, ...updated } : lead
        )
      );
    } catch (error) {
      console.error("update lead error:", error);
      alert("Update failed");
    }
  }

  async function sendSms(lead: Lead) {
    try {
      const el = document.getElementById(
        `sms-${lead._id}`
      ) as HTMLTextAreaElement | null;

      const message = el?.value?.trim();

      if (!message) {
        alert("Write a message first");
        return;
      }

      setSendingId(lead._id);

      const res = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: lead.phone,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "SMS failed");
        return;
      }

      alert("SMS sent ✅");

      if (el) el.value = "";

      await updateLead(lead._id, {
        status: lead.status === "new" ? "contacted" : lead.status,
      });
    } catch (error) {
      console.error("send sms error:", error);
      alert("SMS failed");
    } finally {
      setSendingId(null);
    }
  }

  const grouped = useMemo(() => {
    return columns.reduce((acc: Record<string, Lead[]>, status) => {
      acc[status] = leads.filter((lead) => lead.status === status);
      return acc;
    }, {});
  }, [leads]);

  if (loading) {
    return <div className="p-10">Loading CRM...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Lead CRM Pipeline</h1>

        <p className="text-gray-500 mt-2">
          Manage customer follow-ups, deals, notes, and SMS replies.
        </p>
      </div>

      {/* BOARD */}
      <div className="grid gap-6 lg:grid-cols-6">
        {columns.map((status) => (
          <div
            key={status}
            className="rounded-2xl bg-white p-4 shadow-sm border"
          >
            {/* COLUMN HEADER */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold uppercase text-sm">{status}</h2>

              <span className="rounded-full bg-black text-white text-xs px-2 py-1">
                {grouped[status]?.length || 0}
              </span>
            </div>

            {/* LEADS */}
            <div className="space-y-4">
              {grouped[status]?.map((lead: Lead) => (
                <div
                  key={lead._id}
                  className="rounded-2xl border p-4 bg-gray-50"
                >
                  {/* PRIORITY + STATUS */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${priorityColor(
                        lead.priority
                      )}`}
                    >
                      {lead.priority || "cold"}
                    </span>

                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateLead(lead._id, {
                          status: e.target.value as Lead["status"],
                        })
                      }
                      className="text-xs border rounded px-2 py-1"
                    >
                      {columns.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CUSTOMER */}
                  <h3 className="font-bold">{lead.name}</h3>

                  <p className="text-sm text-gray-600">{lead.phone}</p>

                  {lead.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {lead.email}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Source: {lead.source}
                  </p>

                  {/* MESSAGE */}
                  <div className="mt-3 rounded-xl bg-white border p-3 text-sm">
                    {lead.message || "No message"}
                  </div>

                  {/* NOTES */}
                  <textarea
                    defaultValue={lead.notes || ""}
                    onBlur={(e) =>
                      updateLead(lead._id, {
                        notes: e.target.value,
                      })
                    }
                    className="mt-3 w-full rounded-xl border p-2 text-xs min-h-[80px]"
                    placeholder="Add notes..."
                  />

                  {/* SMS BOX */}
                  <div className="mt-3">
                    <textarea
                      placeholder="Send SMS to customer..."
                      className="w-full border rounded-xl p-2 text-sm"
                      rows={3}
                      id={`sms-${lead._id}`}
                    />

                    <button
                      type="button"
                      onClick={() => sendSms(lead)}
                      disabled={sendingId === lead._id}
                      className="mt-2 w-full bg-black text-white py-2 rounded-xl disabled:opacity-50"
                    >
                      {sendingId === lead._id ? "Sending..." : "Send SMS"}
                    </button>
                  </div>
                  <button
  type="button"
  onClick={async () => {
    const ok = confirm("Delete this lead?");

    if (!ok) return;

    const res = await fetch(`/api/leads/${lead._id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      setLeads((prev) =>
        prev.filter((item) => item._id !== lead._id)
      );
    } else {
      alert(data.error || "Delete failed");
    }
  }}
  className="mt-3 w-full bg-red-600 text-white py-2 rounded-xl"
>
  Delete Lead
</button>

                  {/* FOOTER */}
                  <div className="mt-3 text-xs text-gray-400">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
{/* EMAIL BOX */}
{lead.email && (
  <div className="mt-3">
    <textarea
      placeholder="Send email to customer..."
      className="w-full border rounded-xl p-2 text-sm"
      rows={4}
      id={`email-${lead._id}`}
    />

    <button
      type="button"
      onClick={async () => {
        const el = document.getElementById(
          `email-${lead._id}`
        ) as HTMLTextAreaElement;

        const message = el.value.trim();

        if (!message) {
          alert("Write an email first");
          return;
        }

        const res = await fetch("/api/admin/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: lead.email,
            subject: "Drive Prime Motors",
            message,
          }),
        });

        const data = await res.json();

        if (data.success) {
          alert("Email sent ✅");
          el.value = "";
        } else {
          alert(data.error || "Email failed");
        }
      }}
      className="mt-2 w-full bg-blue-600 text-white py-2 rounded-xl"
    >
      Send Email
    </button>
  </div>
)}

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}