export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import DeleteVehicleLeadButton from "@/components/admin/DeleteVehicleLeadButton";
import { proThumb } from "@/lib/cloudinaryImage";
import CreateCarFromLeadButton from "@/components/admin/CreateCarFromLeadButton";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

export default async function VehicleLeadsPage() {
  await connectDB();

  const leads = await VehicleLead.find({ status: { $ne: "deleted" } })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Leads</h1>
          <p className="mt-1 text-gray-500">
            Sell Your Car submissions from customers
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6">
        {leads.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-gray-500">
            No vehicle leads yet.
          </div>
        )}

        {leads.map((lead: any) => (
          <div key={String(lead._id)} className="rounded-xl border bg-white p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {lead.year} {lead.make} {lead.model}
                </h2>
                <p className="text-sm text-gray-500">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>

              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
                {lead.status || "new"}
              </span>
              {lead.status !== "converted" && (
  <CreateCarFromLeadButton leadId={String(lead._id)} />
  
)}
            </div>
            <DeleteVehicleLeadButton leadId={String(lead._id)} />

            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Name" value={lead.name} />
              <Info label="Phone" value={lead.phone} />
              <Info label="Email" value={lead.email} />
              <Info label="VIN" value={lead.vin} />
              <Info label="Mileage" value={lead.mileage} />
              <Info label="Asking Price" value={lead.price} />
            </div>

            {lead.message && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Message</p>
                <p className="mt-1 text-gray-800">{lead.message}</p>
              </div>
            )}

            {lead.images?.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                {lead.images.map((url: string, i: number) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    className="block overflow-hidden rounded-xl border"
                  >
                    <img
                      src={proThumb(url)}
                      alt={`Vehicle lead photo ${i + 1}`}
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="font-medium">{value || "N/A"}</p>
    </div>
  );
}