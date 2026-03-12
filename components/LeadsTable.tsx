"use client";

import { useState } from "react";

type Lead = {
  _id: string;
  carId: string;
  carTitle: string;
  customerName: string;
  phone: string;
  email: string;
  message: string;
  status: "new" | "contacted" | "won" | "lost";
  createdAt: string;
};

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const [items, setItems] = useState(leads);

  async function updateStatus(id: string, status: Lead["status"]) {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Status update failed");
      return;
    }

    setItems((prev) =>
      prev.map((lead) => (lead._id === id ? { ...lead, status } : lead))
    );
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>

          <tbody>
            {items.map((lead) => (
              <tr key={lead._id} className="border-t align-top">
                <td className="px-4 py-3">
                  <div className="font-medium">{lead.customerName || "No name"}</div>
                  <div className="text-gray-600">{lead.phone || "No phone"}</div>
                  <div className="text-gray-600">{lead.email || "No email"}</div>
                </td>

                <td className="px-4 py-3">{lead.carTitle}</td>

                <td className="px-4 py-3 max-w-sm">
                  <div className="whitespace-pre-wrap">{lead.message || "—"}</div>
                </td>

                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateStatus(lead._id, e.target.value as Lead["status"])
                    }
                    className="rounded-lg border px-3 py-2"
                  >
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </td>

                <td className="px-4 py-3 text-gray-600">
                  {new Date(lead.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}