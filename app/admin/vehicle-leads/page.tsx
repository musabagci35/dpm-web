export const dynamic = "force-dynamic";
export const revalidate = 0;

import DeleteVehicleLeadButton from "@/components/admin/DeleteVehicleLeadButton";
import { proThumb } from "@/lib/cloudinaryImage";
import CreateCarFromLeadButton from "@/components/admin/CreateCarFromLeadButton";
import { connectDB } from "@/lib/mongodb";
import VehicleLead from "@/models/VehicleLead";

function statusClass(status: string) {
  if (status === "converted") return "bg-green-100 text-green-700";
  if (status === "new") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default async function VehicleLeadsPage() {
  await connectDB();

  const leads = await VehicleLead.find({ status: { $ne: "deleted" } })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Sell / Trade Leads</h1>
        <p className="mt-1 text-gray-500">
          Sell Your Car submissions from customers
        </p>
      </div>

      <div className="grid gap-6">
        {leads.length === 0 && (
          <div className="rounded-2xl border bg-white p-12 text-center text-gray-500 shadow-sm">
            No vehicle leads yet.
          </div>
        )}

        {leads.map((lead: any) => (
          <div key={String(lead._id)} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <span
                  className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase ${statusClass(
                    lead.status || "new"
                  )}`}
                >
                  {lead.status || "new"}
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {lead.year} {lead.make} {lead.model}
                </h2>
                <p className="text-sm text-gray-500">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleString()
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.status !== "converted" && (
                  <CreateCarFromLeadButton leadId={String(lead._id)} />
                )}
                <DeleteVehicleLeadButton leadId={String(lead._id)} />
              </div>
            </div>

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
    </div>
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