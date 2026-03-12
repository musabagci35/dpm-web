"use client";

import { useEffect, useState } from "react";

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    fetch("/api/vehicle-leads/get")
      .then((res) => res.json())
      .then((data) => setLeads(data));
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/vehicle-leads/update-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    setLeads((prev: any) =>
      prev.map((lead: any) =>
        lead._id === id ? { ...lead, status } : lead
      )
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold mb-10">Vehicle Leads</h1>

      <div className="space-y-6">
        {leads.map((lead: any) => (
          <div key={lead._id} className="border rounded-xl p-6 bg-white shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">{lead.carTitle}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>

              <select
                value={lead.status || "new"}
                onChange={(e) => updateStatus(lead._id, e.target.value)}
                className="border rounded px-3 py-1"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="appointment">Appointment</option>
                <option value="sold">Sold</option>
                <option value="dead">Dead</option>
              </select>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <p><strong>Name:</strong> {lead.name}</p>
              <p><strong>Phone:</strong> {lead.phone}</p>
              <p><strong>Email:</strong> {lead.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}