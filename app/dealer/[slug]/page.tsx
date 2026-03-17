import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import VinHistory from "@/models/VinHistory";

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default async function DealerDashboardPage() {
  await connectDB();

  const [totalCars, liveCars, vinImports, latestCars, vinHistory] =
    await Promise.all([
      Car.countDocuments({}),
      Car.countDocuments({ isActive: true }),
      VinHistory.countDocuments({}),
      Car.find(
        {},
        {
          make: 1,
          model: 1,
          year: 1,
          vin: 1,
          price: 1,
          images: 1,
          isActive: 1,
          createdAt: 1,
        }
      )
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      VinHistory.find(
        {},
        {
          vin: 1,
          make: 1,
          model: 1,
          year: 1,
          createdAt: 1,
        }
      )
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  const prices = latestCars
    .map((car: any) => Number(car?.price || 0))
    .filter((price: number) => price > 0);

  const totalInventoryValue = prices.reduce(
    (sum: number, price: number) => sum + price,
    0
  );

  const averagePrice =
    prices.length > 0 ? Math.round(totalInventoryValue / prices.length) : 0;

  const potentialProfit =
    totalInventoryValue > 0 ? Math.round(totalInventoryValue * 0.12) : 0;

  const newestCar = latestCars[0] || null;
  const newestVinImport = vinHistory[0] || null;

  const aiNotes = [
    totalCars === 0
      ? "No vehicles in inventory yet."
      : `You currently have ${totalCars} vehicles in inventory.`,
    liveCars < totalCars
      ? "Some vehicles are not live yet. Review inactive listings."
      : "All current vehicles appear live.",
    averagePrice > 0
      ? `Average visible price is ${formatMoney(averagePrice)}.`
      : "Some vehicles are missing prices.",
    newestVinImport
      ? `Latest VIN import: ${newestVinImport.year || ""} ${newestVinImport.make || ""} ${newestVinImport.model || ""}`.trim()
      : "No VIN imports recorded yet.",
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Dealer Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Quick overview of inventory</p>
        </div>

        <div className="flex gap-3 mb-10 flex-wrap">
          <Link
            href="/admin/add-car"
            className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Add Vehicle
          </Link>

          <Link
            href="/admin/cars"
            className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-white transition"
          >
            Inventory
          </Link>

          <Link
            href="/admin/crm"
            className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-white transition"
          >
            CRM
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border rounded-2xl p-6">
            <p className="text-gray-500 text-sm">Total Vehicles</p>
            <p className="text-4xl font-bold mt-2">{totalCars}</p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-gray-500 text-sm">Live Vehicles</p>
            <p className="text-4xl font-bold mt-2">{liveCars}</p>
          </div>

          <div className="bg-white border rounded-2xl p-6">
            <p className="text-gray-500 text-sm">VIN Imports</p>
            <p className="text-4xl font-bold mt-2">{vinImports}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          <section className="bg-white border rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">Dealer AI Overview</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Smart inventory summary and operational insights
                </p>
              </div>

              <div className="rounded-full bg-black text-white px-4 py-2 text-sm">
                AI Active
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="text-2xl font-bold mt-2">
                  {formatMoney(totalInventoryValue)}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Est Dealer Profit</p>
                <p className="text-2xl font-bold mt-2">
                  {formatMoney(potentialProfit)}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Average Price</p>
                <p className="text-2xl font-bold mt-2">
                  {averagePrice ? formatMoney(averagePrice) : "Missing Data"}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Newest Vehicle</p>
                <p className="text-lg font-semibold mt-2">
                  {newestCar
                    ? `${newestCar.year || ""} ${newestCar.make || ""} ${newestCar.model || ""}`.trim()
                    : "No vehicle"}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-sm text-gray-500">Latest VIN Import</p>
                <p className="text-lg font-semibold mt-2">
                  {newestVinImport
                    ? `${newestVinImport.year || ""} ${newestVinImport.make || ""} ${newestVinImport.model || ""}`.trim()
                    : "No import"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 border p-5">
              <h3 className="font-semibold mb-3">AI Notes</h3>

              <div className="space-y-2 text-sm text-gray-700">
                {aiNotes.map((note, index) => (
                  <div key={index} className="flex gap-2">
                    <span>•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">Latest Vehicles</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Most recently added inventory
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {latestCars.length === 0 && (
                <p className="text-gray-500">No vehicles added yet.</p>
              )}

              {latestCars.map((car: any) => (
                <div
                  key={String(car._id)}
                  className="flex justify-between items-center gap-4 border rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={car?.images?.[0]?.url || "/car.png"}
                      alt="Vehicle"
                      className="w-14 h-14 object-cover rounded-lg shrink-0"
                    />

                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {car.year} {car.make} {car.model}
                      </p>

                      <p className="text-sm text-gray-500 truncate">
                        VIN: {car.vin || "N/A"}
                      </p>

                      <p className="text-sm font-medium mt-1">
                        {car.price ? formatMoney(car.price) : "No Price"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/edit-car/${car._id}`}
                    className="border px-3 py-1 rounded-lg hover:bg-gray-50 transition shrink-0"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-white border rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5">Recent VIN Imports</h2>

          <div className="space-y-4">
            {vinHistory.length === 0 && (
              <p className="text-gray-500">No VIN imports yet.</p>
            )}

            {vinHistory.map((v: any) => (
              <div
                key={String(v._id)}
                className="flex justify-between items-center gap-4 border rounded-xl p-4"
              >
                <div>
                  <p className="font-semibold">
                    {v.year} {v.make} {v.model}
                  </p>

                  <p className="text-sm text-gray-500">VIN: {v.vin}</p>
                </div>

                <Link
                  href={`/admin/add-car?vin=${v.vin}`}
                  className="border px-3 py-1 rounded-lg hover:bg-gray-50 transition shrink-0"
                >
                  Import Again
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}