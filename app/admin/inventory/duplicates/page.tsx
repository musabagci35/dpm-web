export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function statusClass(status: string) {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "sold") return "bg-red-600 text-white";
  if (status === "archived") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default async function DuplicateVehiclesPage() {
  await connectDB();

  // Read-only diagnostic: group vehicles by VIN and surface any VIN that
  // appears on more than one record. No data is changed here — this only
  // helps an admin find records worth reviewing manually via the existing
  // status/delete controls on the Inventory page.
  const duplicateVins = await Car.aggregate([
    { $match: { vin: { $nin: [null, ""] } } },
    { $group: { _id: "$vin", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const vins = duplicateVins.map((g: any) => g._id);

  const cars = vins.length
    ? await Car.find({ vin: { $in: vins } })
        .select("vin year make model trim status price slug isActive createdAt")
        .sort({ vin: 1, createdAt: 1 })
        .lean()
    : [];

  const groups = new Map<string, any[]>();
  for (const car of cars) {
    const list = groups.get(car.vin) || [];
    list.push(car);
    groups.set(car.vin, list);
  }

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/admin/inventory"
          className="text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          ← Back to Inventory
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Duplicate Vehicles</h1>
        <p className="mt-1 text-gray-500">
          Read-only report of VINs that appear on more than one vehicle record.
          Nothing here is changed automatically — review each record and use
          the status or delete controls on the Inventory page if action is
          needed.
        </p>
      </div>

      {groups.size === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No duplicate VINs found</h2>
          <p className="mt-2 text-gray-500">
            Every vehicle with a VIN on file is currently unique.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([vin, records]) => (
            <div key={vin} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  <span className="font-mono font-bold text-gray-900">{vin}</span>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">
                  {records.length} RECORDS
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {records.map((car: any) => (
                  <div
                    key={car._id.toString()}
                    className="rounded-xl border p-3 text-sm"
                  >
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${statusClass(
                          car.status || "available"
                        )}`}
                      >
                        {car.status || "available"}
                      </span>
                      {!car.isActive && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="font-bold text-gray-900">
                      {car.year} {car.make} {car.model} {car.trim || ""}
                    </p>
                    <p className="mt-1 text-gray-500">
                      {car.price > 0 ? `$${Number(car.price).toLocaleString()}` : "No price set"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Added{" "}
                      {car.createdAt
                        ? new Date(car.createdAt).toLocaleDateString()
                        : "unknown"}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/admin/edit-car/${car._id}`}
                        className="flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-semibold hover:bg-gray-50"
                      >
                        Review
                      </Link>
                      <Link
                        href={`/inventory/${car.slug || car._id}`}
                        target="_blank"
                        className="flex-1 rounded-lg border px-3 py-1.5 text-center text-xs font-semibold hover:bg-gray-50"
                      >
                        View Live
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
