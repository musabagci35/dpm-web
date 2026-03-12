import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function HomePage() {
  await connectDB();

  const cars = await Car.find().sort({ createdAt: -1 }).lean();
  const featuredCars = cars.slice(0, 6);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HERO */}
      <section className="bg-gradient-to-b from-black via-gray-900 to-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Drive Prime Motors LLC
          </h1>

          <p className="mt-4 text-lg text-white/80 max-w-3xl mx-auto">
            Quality used vehicles in California. Fast financing approvals,
            transparent pricing, and a dealership you can trust.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">

            <Link
              href="/inventory"
              className="rounded-xl bg-red-600 px-7 py-3 font-semibold hover:bg-red-700 transition"
            >
              Browse Inventory
            </Link>

            <Link
              href="/financing"
              className="rounded-xl border border-white/40 px-7 py-3 font-semibold hover:bg-white/10 transition"
            >
              Apply for Financing
            </Link>

          </div>

          <p className="mt-4 text-sm text-white/60">
            Bad credit? No credit? First-time buyer? We can help.
          </p>

        </div>
      </section>

      {/* FEATURED VEHICLES */}
      <section className="mx-auto max-w-6xl px-6 py-16">

        <h2 className="text-3xl font-extrabold text-center mb-12">
          Featured Vehicles
        </h2>

        {featuredCars.length === 0 ? (

          <p className="text-center text-gray-500">
            Inventory coming soon.
          </p>

        ) : (

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

            {featuredCars.map((car: any) => {

              const carId = String(car._id);
              const title = `${car.year} ${car.make} ${car.model}`;

              const price = Number(car.price || 0);
              const mileage = car.mileage ? Number(car.mileage) : null;

              const monthly = price
                ? Math.round((price * 1.15) / 60)
                : 0;

              const image = car.images?.[0]?.url
                ? car.images[0].url.replace(
                    "/upload/",
                    "/upload/f_auto,q_auto,w_900/"
                  )
                : null;

              return (

                <div
                  key={carId}
                  className="overflow-hidden rounded-2xl border bg-white shadow hover:shadow-lg transition"
                >

                  {/* IMAGE */}
                  {image ? (
                    <div className="relative">
                      <img
                        src={image}
                        alt={title}
                        className="h-52 w-full object-cover"
                      />

                      <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow">
                        Easy Financing
                      </span>
                    </div>
                  ) : (
                    <div className="h-52 flex items-center justify-center bg-gray-100 text-gray-400">
                      No Image
                    </div>
                  )}

                  {/* CONTENT */}
                  <div className="p-6">

                    <h3 className="text-lg font-bold">
                      {title}
                    </h3>

                    {mileage !== null && (
                      <p className="mt-1 text-sm text-gray-500">
                        {mileage.toLocaleString()} miles
                      </p>
                    )}

                    <p className="mt-3 text-2xl font-extrabold text-red-600">
                      ${price.toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-600">
                      Est. ${monthly.toLocaleString()} / month
                    </p>

                    <div className="mt-5 flex items-center justify-between">

                      <Link
                        href={`/inventory/${carId}`}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition"
                      >
                        View Details
                      </Link>

                      <Link
                        href="/financing"
                        className="text-sm font-semibold text-blue-600 hover:underline"
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

        {/* VIEW ALL */}
        <div className="mt-14 flex justify-center">

          <Link
            href="/inventory"
            className="rounded-xl bg-black px-7 py-3 font-semibold text-white hover:bg-gray-900 transition"
          >
            View All Vehicles
          </Link>

        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Estimated payment varies by credit profile, term, and lender approval.
        </p>

      </section>

      {/* TRUST SECTION */}
      <section className="bg-white border-t py-14">

        <div className="mx-auto max-w-5xl text-center px-6">

          <h3 className="text-2xl font-bold">
            Why Buy From Drive Prime Motors?
          </h3>

          <div className="mt-10 grid gap-8 md:grid-cols-3">

            <div>
              <h4 className="font-semibold text-lg">
                Quality Vehicles
              </h4>
              <p className="text-gray-600 mt-2">
                Carefully selected vehicles inspected for quality and reliability.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg">
                Easy Financing
              </h4>
              <p className="text-gray-600 mt-2">
                Multiple lenders and flexible programs for every credit situation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-lg">
                Transparent Pricing
              </h4>
              <p className="text-gray-600 mt-2">
                No hidden fees. Honest pricing and clear vehicle history.
              </p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}