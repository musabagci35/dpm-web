import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default async function AdminInventoryPage() {
  await connectDB();

  const cars = await Car.find(
    {},
    {
      year: 1,
      make: 1,
      model: 1,
      vin: 1,
      price: 1,
      mileage: 1,
      isActive: 1,
      images: 1,
      createdAt: 1,
    }
  )
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Inventory Manager</h1>
            <p className="text-gray-500 mt-1">
              Manage all vehicles from one place
            </p>
          </div>

          <Link
            href="/admin/add-car"
            className="rounded-xl bg-black px-4 py-2 text-white font-semibold hover:bg-gray-800 transition"
          >
            Add Vehicle
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-2xl p-5">
            <p className="text-sm text-gray-500">Total Vehicles</p>
            <p className="text-3xl font-bold mt-2">{cars.length}</p>
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <p className="text-sm text-gray-500">Live Vehicles</p>
            <p className="text-3xl font-bold mt-2">
              {cars.filter((car: any) => car.isActive).length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <p className="text-sm text-gray-500">Draft / Inactive</p>
            <p className="text-3xl font-bold mt-2">
              {cars.filter((car: any) => !car.isActive).length}
            </p>
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-3xl font-bold mt-2">
              {formatMoney(
                cars.reduce(
                  (total: number, car: any) => total + Number(car.price || 0),
                  0
                )
              )}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-4 font-semibold">Photo</th>
                  <th className="px-4 py-4 font-semibold">Vehicle</th>
                  <th className="px-4 py-4 font-semibold">VIN</th>
                  <th className="px-4 py-4 font-semibold">Mileage</th>
                  <th className="px-4 py-4 font-semibold">Price</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Added</th>
                  <th className="px-4 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No vehicles found.
                    </td>
                  </tr>
                )}

                {cars.map((car: any) => (
                  <tr key={String(car._id)} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <img
                        src={car?.images?.[0]?.url || "/car.png"}
                        alt="Vehicle"
                        className="h-14 w-20 rounded-lg object-cover border"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {car.year} {car.make} {car.model}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {car.vin || "N/A"}
                    </td>

                    <td className="px-4 py-4">
                      {car.mileage ? Number(car.mileage).toLocaleString() : "—"}
                    </td>

                    <td className="px-4 py-4 font-semibold">
                      {formatMoney(car.price || 0)}
                    </td>

                    <td className="px-4 py-4">
                      {car.isActive ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {car.createdAt
                        ? new Date(car.createdAt).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/edit-car/${car._id}`}
                          className="rounded-lg border px-3 py-1.5 font-medium hover:bg-gray-100 transition"
                        >
                          Edit
                        </Link>

                        <Link
                          href={`/inventory/${car._id}`}
                          className="rounded-lg border px-3 py-1.5 font-medium hover:bg-gray-100 transition"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}