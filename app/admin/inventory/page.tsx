export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { proThumb } from "@/lib/cloudinaryImage";
import Car from "@/models/Car";
import CarStatusButtons from "@/components/admin/CarStatusButtons";

function statusClass(status: string) {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-yellow-100 text-yellow-700";
  if (status === "sold") return "bg-red-100 text-red-700";
  if (status === "archived") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-700";
}

export default async function AdminInventoryPage() {
  await connectDB();
  const cars = await Car.find({
    isActive: true,
    status: { $nin: ["sold", "archived"] },
  })
  
    .sort({ isFeatured: -1, createdAt: -1 })
    .lean();

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Inventory</h1>
          <p className="text-gray-500">{cars.length} vehicles</p>
        </div>

        <Link
          href="/admin/add-car"
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          + Add Vehicle
        </Link>
      </div>

      <div className="grid gap-6">
        {cars.map((car: any) => {
          const status = car.status || "available";
          const isSoldOrArchived = status === "sold" || status === "archived";

          return (
            <div
              key={car._id.toString()}
              className={`border rounded-2xl p-5 flex gap-5 items-center shadow-sm ${
                isSoldOrArchived ? "bg-gray-50 opacity-70" : "bg-white"
              }`}
            >
              <img
                src={proThumb((car.images?.find((img: any) => img.isCover)?.url || car.images?.[0]?.url || "/car.png"))}
                alt={`${car.year} ${car.make} ${car.model}`}
                className="w-40 h-28 object-cover rounded-xl"
              />

              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${statusClass(
                      status
                    )}`}
                  >
                    {status.toUpperCase()}
                  </span>

                  {car.isFeatured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      FEATURED
                    </span>
                  )}

                  {!car.isActive && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
                      INACTIVE
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold">
                  {car.year} {car.make} {car.model}
                </h2>

                <p className="text-gray-500 text-sm">
                  {car.mileage?.toLocaleString() || 0} miles
                </p>

                <p className="text-2xl font-bold mt-2">
                  ${car.price?.toLocaleString() || "Contact"}
                </p>

                {car.slug && (
                  <p className="text-xs text-gray-400 mt-1">
                    Slug: {car.slug}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/inventory/${car._id}`}
                  className="border px-4 py-2 rounded-xl text-center"
                >
                  View
                </Link>

                <Link
                  href={`/admin/edit-car/${car._id}`}
                  className="bg-black text-white px-4 py-2 rounded-xl text-center"
                >
                  Edit
                </Link>
                <CarStatusButtons carId={car._id.toString()} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}