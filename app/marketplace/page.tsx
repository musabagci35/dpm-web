import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Link from "next/link";

export default async function MarketplacePage() {

  await connectDB();

  const cars = await Car.find({ isActive: true }).lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">

      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>

      {cars.length === 0 ? (

        <p className="text-gray-500">No vehicles yet</p>

      ) : (

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {cars.map((car: any) => (

            <Link
              key={car._id}
              href={`/inventory/${car._id}`}
              className="border rounded-xl overflow-hidden hover:shadow-lg transition"
            >

              <img
                src={car.images?.[0]?.url || "/car.png"}
                alt={car.make}
                className="h-48 w-full object-cover"
              />

              <div className="p-4">

                <h2 className="font-semibold text-lg">
                  {car.year} {car.make} {car.model}
                </h2>

                <p className="text-gray-600">
                  {car.mileage?.toLocaleString()} miles
                </p>

                <p className="text-xl font-bold mt-2">
                  ${car.price?.toLocaleString() || "Contact"}
                </p>

              </div>

            </Link>

          ))}

        </div>

      )}

    </div>
  );
}