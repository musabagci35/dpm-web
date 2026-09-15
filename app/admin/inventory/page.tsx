export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { proThumb } from "@/lib/cloudinaryImage";
import Car from "@/models/Car";
import VehicleStatusMenu from "@/components/admin/VehicleStatusMenu";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const TABS = [
  { key: "available", label: "Available" },
  { key: "pending", label: "Pending" },
  { key: "sold", label: "Sold" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

function statusClass(status: string) {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "sold") return "bg-red-600 text-white";
  if (status === "archived") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default async function AdminInventoryPage({ searchParams }: Props) {
  await connectDB();

  const params = (await searchParams) || {};
  const activeTab = TABS.some((t) => t.key === params.status) ? params.status! : "available";

  const query: any = activeTab === "all" ? {} : { status: activeTab };

  const [cars, counts, duplicateVinGroups] = await Promise.all([
    Car.find(query).sort({ isFeatured: -1, createdAt: -1 }).lean(),
    Promise.all([
      Car.countDocuments({ status: "available" }),
      Car.countDocuments({ status: "pending" }),
      Car.countDocuments({ status: "sold" }),
      Car.countDocuments({ status: "archived" }),
      Car.countDocuments({}),
    ]),
    Car.aggregate([
      { $match: { vin: { $nin: [null, ""] } } },
      { $group: { _id: "$vin", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]),
  ]);

  const countMap: Record<string, number> = {
    available: counts[0],
    pending: counts[1],
    sold: counts[2],
    archived: counts[3],
    all: counts[4],
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Inventory</h1>
          <p className="text-gray-500">{cars.length} vehicle{cars.length === 1 ? "" : "s"}</p>
        </div>

        <Link
          href="/admin/add-car"
          className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 font-bold text-white hover:bg-zinc-800"
        >
          + Add Vehicle
        </Link>
      </div>

      {duplicateVinGroups.length > 0 && (
        <Link
          href="/admin/inventory/duplicates"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-800 hover:bg-amber-100"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          {duplicateVinGroups.length} VIN{duplicateVinGroups.length === 1 ? "" : "s"} have
          duplicate vehicle records — review duplicates →
        </Link>
      )}

      <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto rounded-2xl border bg-white p-2 shadow-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "available" ? "/admin/inventory" : `/admin/inventory?status=${tab.key}`}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === tab.key
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">({countMap[tab.key]})</span>
          </Link>
        ))}
      </div>

      {cars.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <h2 className="text-xl font-bold">No vehicles in this view</h2>
          <p className="mt-2 text-gray-500">Try another status filter.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {cars.map((car: any) => {
            const status = car.status || "available";

            return (
              <div
                key={car._id.toString()}
                className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center ${
                  status === "sold" || status === "archived" ? "bg-gray-50" : "bg-white"
                }`}
              >
                <img
                  src={proThumb(
                    car.images?.find((img: any) => img.isCover)?.url ||
                      car.images?.[0]?.url ||
                      "/car.png"
                  )}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="h-40 w-full rounded-xl object-cover sm:h-28 sm:w-40"
                />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black ${statusClass(status)}`}
                    >
                      {status.toUpperCase()}
                    </span>

                    {car.isFeatured && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
                        FEATURED
                      </span>
                    )}
                  </div>

                  <h2 className="truncate text-xl font-bold text-gray-900">
                    {car.year} {car.make} {car.model}
                  </h2>

                  <p className="text-sm text-gray-500">
                    {car.mileage ? `${Number(car.mileage).toLocaleString()} miles` : "Mileage unavailable"}
                  </p>

                  <p className="mt-2 text-2xl font-black text-gray-900">
                    {car.price > 0 ? `$${Number(car.price).toLocaleString()}` : "Call for Price"}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:w-auto">
                  <div className="flex gap-2">
                    <Link
                      href={`/inventory/${car.slug || car._id}`}
                      className="flex-1 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold sm:flex-none"
                    >
                      View
                    </Link>

                    <Link
                      href={`/admin/edit-car/${car._id}`}
                      className="flex-1 rounded-xl bg-black px-4 py-2.5 text-center text-sm font-semibold text-white sm:flex-none"
                    >
                      Edit
                    </Link>
                  </div>

                  <VehicleStatusMenu
                    carId={car._id.toString()}
                    status={status}
                    isFeatured={!!car.isFeatured}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
