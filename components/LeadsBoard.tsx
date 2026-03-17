"use client";

import { useState } from "react";

export default function LeadsBoard({ leads }: any) {

  const [data, setData] = useState(leads);

  const columns = ["new", "contacted", "won", "lost"];

  async function updateStatus(leadId: string, status: string) {

    await fetch("/api/leads/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ leadId, status }),
    });

    setData((prev: any) =>
      prev.map((lead: any) =>
        lead._id === leadId ? { ...lead, status } : lead
      )
    );
  }

  return (

    <div className="grid grid-cols-4 gap-6">

      {columns.map((col) => (

        <div key={col} className="border rounded-xl p-4 bg-gray-50">

          <h2 className="font-bold mb-4 capitalize">
            {col}
          </h2>

          <div className="space-y-3">

            {data
              .filter((l: any) => l.status === col)
              .map((lead: any) => (

                <div
                  key={lead._id}
                  className="bg-white border rounded p-3"
                >

                  <p className="font-semibold">
                    {lead.customerName || "Unknown"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {lead.vin}
                  </p>

                  <p className="text-xs">
                    {lead.phone}
                  </p>

                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateStatus(lead._id, e.target.value)
                    }
                    className="border mt-2 text-xs"
                  >

                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>

                  </select>

                </div>

              ))}

          </div>

        </div>

      ))}

    </div>

  );
}