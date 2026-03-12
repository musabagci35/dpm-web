import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import InventoryFilter from "@/components/InventoryFilter";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {

  const params = await searchParams;

  await connectDB();

  const query: any = {};

  /* SEARCH */
  if (params?.search) {
    query.$or = [
      { make: { $regex: params.search, $options: "i" } },
      { model: { $regex: params.search, $options: "i" } },
    ];
  }

  if (params?.make) {
    query.make = { $regex: params.make, $options: "i" };
  }

  if (params?.model) {
    query.model = { $regex: params.model, $options: "i" };
  }

  if (params?.price) {
    query.price = { $lte: Number(params.price) };
  }

  if (params?.year) {
    query.year = { $gte: Number(params.year) };
  }

  if (params?.mileage) {
    query.mileage = { $lte: Number(params.mileage) };
  }

  /* FETCH */
  const carsRaw = await Car.find(query)
    .sort({ createdAt: -1 })
    .lean();

  /* FIX OBJECTID */
  const cars = carsRaw.map((car: any) => ({
    ...car,
    _id: car._id.toString(),
  }));

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <section className="bg-black text-white py-14">
        <div className="max-w-6xl mx-auto px-6">

          <h1 className="text-4xl font-extrabold">
            Available Inventory
          </h1>

          <p className="text-white/70 mt-2">
            Browse quality pre-owned vehicles from Drive Prime Motors.
          </p>

        </div>
      </section>

      {/* INVENTORY */}
      <section className="max-w-6xl mx-auto px-6 py-14">

        <InventoryFilter />

        {cars.length === 0 ? (

          <p className="text-center text-gray-500 mt-10">
            No vehicles found.
          </p>

        ) : (

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {cars.map((car: any) => {

              const carId = car._id;

              const title =
                `${car.year} ${car.make} ${car.model}`;

              const price =
                Number(car.price || car.marketPrice || 0);

              const mileage =
                car.mileage ? Number(car.mileage) : null;

              const monthly =
                price ? Math.round((price * 1.15) / 60) : 0;

              const image =
                car.images?.[0]?.url ||
                "/car-placeholder.jpg";

              return (

                <div
                  key={carId}
                  className="overflow-hidden rounded-2xl border bg-white shadow hover:shadow-xl transition"
                >

                  <img
                    src={image}
                    alt={title}
                    className="h-52 w-full object-cover"
                  />

                  <div className="p-6">

                    <h3 className="text-lg font-bold">
                      {title}
                    </h3>

                    {mileage && (
                      <p className="text-sm text-gray-500">
                        {mileage.toLocaleString()} miles
                      </p>
                    )}

                    <p className="mt-2 text-2xl font-extrabold text-red-600">
                      ${price.toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-600">
                      Est. ${monthly.toLocaleString()} / month
                    </p>

                    <div className="mt-4 flex justify-between">

                      <Link
                        href={`/inventory/${carId}`}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm"
                      >
                        View Details
                      </Link>

                      <Link
                        href="/financing"
                        className="text-blue-600 text-sm font-semibold"
                      >
                        Get Approved →
                      </Link>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        )}

      </section>

    </main>
  );
}