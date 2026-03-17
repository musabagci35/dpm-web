import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function HomePage() {

  await connectDB();

  const cars = await Car.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  return (
    <main className="bg-white">

      {/* HERO */}
      <section className="bg-gray-900 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Find Your Next Car
          </h1>

          <p className="text-gray-300 mb-8">
            Quality used vehicles with transparent pricing and easy financing.
          </p>

          <Link
            href="/inventory"
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold"
          >
            Browse Inventory
          </Link>

        </div>
      </section>

      {/* FEATURED VEHICLES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">
              Featured Vehicles
            </h2>

            <Link
              href="/inventory"
              className="text-red-600 font-semibold"
            >
              View All
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {cars.map((car: any) => (

              <Link
                key={car._id}
                href={`/inventory/${car._id}`}
                className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition"
              >

                <img
                  src={car.images?.[0]?.url || "/car.png"}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4">

                  <h3 className="font-semibold text-lg">
                    {car.year} {car.make} {car.model}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {car.mileage?.toLocaleString()} miles
                  </p>

                  <p className="text-xl font-bold mt-3">
                    ${car.price?.toLocaleString()}
                  </p>

                </div>

              </Link>

            ))}

          </div>

        </div>
      </section>

      {/* FINANCING */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">

          <h2 className="text-3xl font-bold mb-4">
            Easy Auto Financing
          </h2>

          <p className="text-gray-600 mb-8">
            We work with multiple lenders to help you get approved fast.
          </p>

          <Link
            href="/financing"
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold"
          >
            Apply for Financing
          </Link>

        </div>
      </section>

      {/* TRUST */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">

          <div>
            <h3 className="text-xl font-bold mb-2">
              Transparent Pricing
            </h3>
            <p className="text-gray-600">
              No hidden fees and clear vehicle history.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">
              Quality Vehicles
            </h3>
            <p className="text-gray-600">
              Carefully inspected used cars.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-2">
              Trusted Dealer
            </h3>
            <p className="text-gray-600">
              Serving California drivers with confidence.
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}