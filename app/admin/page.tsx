import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import VinHistory from "@/models/VinHistory";

import CraigslistPostButton from "@/components/CraigslistPostButton";
import AdminQuickActions from "@/components/AdminQuickActions";
import RunMarketingButton from "@/components/RunMarketingButton";
import OfferUpDraftButton from "@/components/OfferUpDraftButton";
import MarketplaceDraftButton from "@/components/MarketplaceDraftButton";
import RemoveCarButton from "@/components/RemoveCarButton";
import FacebookPostButton from "@/components/FacebookPostButton";
import FacebookAutoPost from "@/components/FacebookAutoPost";

export default async function AdminDashboardPage() {

  await connectDB();

  const [totalCars, liveCars] = await Promise.all([
    Car.countDocuments({}),
    Car.countDocuments({ isActive: true }),
  ]);

  const latestCarsRaw = await Car.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const vinHistoryRaw = await VinHistory.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const latestCars = latestCarsRaw.map((car: any) => ({
    ...car,
    _id: car._id.toString(),
  }));

  const vinHistory = vinHistoryRaw.map((v: any) => ({
    ...v,
    _id: v._id.toString(),
  }));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* HEADER */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Dealer Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-600">
              Quick overview of inventory.
            </p>
          </div>

          <div className="flex gap-2">

            <Link
              href="/admin/add-car"
              className="rounded-xl bg-black px-4 py-2 text-sm text-white"
            >
              Add Car
            </Link>

            <Link
              href="/admin/inventory"
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Inventory
            </Link>

          </div>

        </div>

        {/* METRICS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <MetricCard
            title="Total Vehicles"
            value={totalCars}
            href="/admin/inventory"
          />

          <MetricCard
            title="Live Vehicles"
            value={liveCars}
            href="/admin/inventory"
          />

        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-6">
          <AdminQuickActions />
        </div>

        {/* LATEST VEHICLES */}
        <div className="mt-6 rounded-2xl border bg-white p-5">

          <div className="text-lg font-semibold">
            Latest Vehicles
          </div>

          {latestCars.length === 0 ? (

            <div className="mt-4 rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">
              No vehicles found.
            </div>

          ) : (

            <div className="mt-4 space-y-3">

              {latestCars.map((car: any) => {

                const id = car._id;

                return (

                  <div
                    key={id}
                    className="rounded-xl border p-4 flex items-center justify-between"
                  >

                    <div className="flex items-center gap-4">

                      <img
                        src={car.images?.[0]?.url ?? "/car.png"}
                        alt="vehicle"
                        className="w-16 h-16 object-cover rounded"
                      />

                      <div>

                        <div className="font-medium">
                          {car.year} {car.make} {car.model}
                        </div>

                        <div className="text-sm text-gray-600">
                          VIN: {car.vin || "—"}
                        </div>

                      </div>

                    </div>

                    <div className="flex gap-2 flex-wrap">

                      <Link
                        href={`/admin/edit-car/${id}`}
                        className="rounded-lg border px-3 py-1.5 text-xs"
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/inventory/${id}`}
                        className="rounded-lg border px-3 py-1.5 text-xs"
                      >
                        View
                      </Link>

                      <RemoveCarButton id={id} />

                      <CraigslistPostButton carId={id} />

                      <FacebookPostButton carId={id} />

                      <FacebookAutoPost carId={id} />

                      <MarketplaceDraftButton carId={id} />

                      <OfferUpDraftButton carId={id} />

                      <RunMarketingButton carId={id} />

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

        {/* VIN HISTORY */}
        <div className="mt-6 rounded-2xl border bg-white p-5">

          <div className="text-lg font-semibold">
            Recent VIN Imports
          </div>

          {vinHistory.length === 0 ? (

            <div className="mt-4 text-sm text-gray-600">
              No VIN history found.
            </div>

          ) : (

            <div className="mt-4 space-y-2">

              {vinHistory.map((v: any) => {

                const vin = v.vin;

                return (

                  <div
                    key={v._id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >

                    <div>

                      <div className="font-medium">
                        {v.year} {v.make} {v.model}
                      </div>

                      <div className="text-sm text-gray-600">
                        VIN: {v.vin}
                      </div>

                    </div>

                    <Link
                      href={`/admin/add-car?vin=${vin}`}
                      className="text-xs border px-3 py-1 rounded"
                    >
                      Import Again
                    </Link>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      </div>
    </div>
  );
}

/* METRIC CARD */

function MetricCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {

  return (

    <Link href={href}>

      <div className="rounded-2xl border bg-white p-5 hover:shadow cursor-pointer transition">

        <div className="text-sm text-gray-600">
          {title}
        </div>

        <div className="mt-2 text-3xl font-bold">
          {value.toLocaleString()}
        </div>

      </div>

    </Link>

  );
}