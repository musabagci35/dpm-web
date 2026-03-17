import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import VinHistory from "@/models/VinHistory";
import DealerAIPanel from "@/components/DealerAIPanel";
import AuctionAIPanel from "@/components/AuctionAIPanel";

export default async function AdminDashboardPage() {

  await connectDB();

  const [totalCars, liveCars, vinImports] = await Promise.all([
    Car.countDocuments({}),
    Car.countDocuments({ isActive: true }),
    VinHistory.countDocuments({})
  ]);

  const latestCars = await Car.find(
    {},
    { make: 1, model: 1, year: 1, vin: 1, images: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const vinHistory = await VinHistory.find(
    {},
    { make: 1, model: 1, year: 1, vin: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HERO HEADER */}

      <div className="bg-gradient-to-r from-black to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">

          <img
            src="/logo.png"
            alt="Drive Prime Motors"
            className="mx-auto w-28 mb-6"
          />

          <h1 className="text-4xl font-bold">
            Drive Prime Dealer Control
          </h1>

          <p className="text-white/70 mt-3">
            Inventory · Leads · Pricing Intelligence · Marketing
          </p>

        </div>
      </div>

      {/* DASHBOARD CONTENT */}

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ACTION BUTTONS */}

        <div className="flex gap-3 mb-10 flex-wrap">

          <Link
            href="/admin/add-car"
            className="bg-black text-white px-5 py-2 rounded-lg"
          >
            Add Vehicle
          </Link>

          <Link
            href="/admin/inventory"
            className="border px-5 py-2 rounded-lg"
          >
            Inventory
          </Link>

          <Link
            href="/admin/crm"
            className="border px-5 py-2 rounded-lg"
          >
            CRM
          </Link>

        </div>

        {/* METRICS */}

        <div className="grid md:grid-cols-3 gap-6 mb-12">

          <div className="bg-white border rounded-xl p-6">
            <p className="text-gray-500 text-sm">Total Vehicles</p>
            <p className="text-4xl font-bold mt-2">{totalCars}</p>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <p className="text-gray-500 text-sm">Live Vehicles</p>
            <p className="text-4xl font-bold mt-2">{liveCars}</p>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <p className="text-gray-500 text-sm">VIN Imports</p>
            <p className="text-4xl font-bold mt-2">{vinImports}</p>
          </div>

        </div>

        {/* AI PANELS */}

        <div className="grid md:grid-cols-2 gap-6 mb-12">

          <DealerAIPanel />

          <AuctionAIPanel latestCars={latestCars} />

        </div>

        {/* LATEST VEHICLES */}

        <div className="bg-white border rounded-xl p-6 mb-10">

          <h2 className="text-xl font-bold mb-5">
            Latest Vehicles
          </h2>

          {latestCars.length === 0 && (
            <p className="text-gray-500">
              No vehicles added yet.
            </p>
          )}

          {latestCars.map((car: any) => (

            <div
              key={String(car._id)}
              className="flex justify-between items-center py-3 border-b"
            >

              <div className="flex items-center gap-3">

                <img
                  src={car.images?.[0]?.url ?? "/car.png"}
                  alt="Vehicle"
                  className="w-12 h-12 object-cover rounded"
                />

                <div>

                  <p className="font-semibold">
                    {car.year} {car.make} {car.model}
                  </p>

                  <p className="text-sm text-gray-500">
                    VIN: {car.vin}
                  </p>

                </div>

              </div>

              <Link
                href={`/admin/edit-car/${car._id}`}
                className="border px-3 py-1 rounded"
              >
                Edit
              </Link>

            </div>

          ))}

        </div>

        {/* VIN HISTORY */}

        <div className="bg-white border rounded-xl p-6">

          <h2 className="text-xl font-bold mb-5">
            Recent VIN Imports
          </h2>

          {vinHistory.length === 0 && (
            <p className="text-gray-500">
              No VIN imports yet.
            </p>
          )}

          {vinHistory.map((v: any) => (

            <div
              key={String(v._id)}
              className="flex justify-between items-center py-3 border-b"
            >

              <div>

                <p className="font-semibold">
                  {v.year} {v.make} {v.model}
                </p>

                <p className="text-sm text-gray-500">
                  VIN: {v.vin}
                </p>

              </div>

              <Link
                href={`/admin/add-car?vin=${v.vin}`}
                className="border px-3 py-1 rounded"
              >
                Import Again
              </Link>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}