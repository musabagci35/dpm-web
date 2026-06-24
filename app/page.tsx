export const dynamic = "force-dynamic";
export const revalidate = 0;


import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function getCarImage(car: any) {
  const coverImage = car.images?.find((img: any) => img.isCover)?.url;
  const firstImage = car.images?.[0]?.url;

  if (coverImage && coverImage.startsWith("http")) return coverImage;
  if (firstImage && firstImage.startsWith("http")) return firstImage;

  return "/car.png";
}

function formatMileage(mileage?: number) {
  if (!mileage || mileage <= 0) return "Mileage unavailable";
  return `${Number(mileage).toLocaleString()} miles`;
}

export default async function HomePage() {
  await connectDB();

  const featuredCars = await Car.find({
    isActive: true,
    status: { $ne: "sold" },
    isFeatured: true,
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const newestCars = await Car.find({
    isActive: true,
    status: { $ne: "sold" },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const cars = featuredCars.length > 0 ? featuredCars : newestCars;

  return (
    <main className="bg-white text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-red-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-600 blur-3xl" />
          <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-100">
              Sacramento Used Car Dealer
            </p>

            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              Quality Used Cars in Sacramento
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
              Drive Prime Motors helps you find reliable used vehicles with
              transparent pricing, easy financing options, and trade-in support.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inventory"
                className="rounded-2xl bg-red-600 px-7 py-4 text-center font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-700"
              >
                Browse Inventory
              </Link>

              <Link
                href="/financing"
                className="rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black"
              >
                Get Financing
              </Link>

              <a
                href="tel:+19162618880"
                className="rounded-2xl border border-white/25 px-7 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black"
              >
                Call (916) 261-8880
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                "Dealer Inspected",
                "Financing Available",
                "Trade-Ins Welcome",
                "Sacramento, CA",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white/90"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5 text-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    Featured Inventory
                  </p>
                  <h2 className="text-2xl font-black">Ready to Drive</h2>
                </div>
                <Link
                  href="/inventory"
                  className="text-sm font-bold text-red-600 hover:text-red-700"
                >
                  View all
                </Link>
              </div>

              {cars[0] ? (
                <Link
                  href={`/inventory/${cars[0].slug || cars[0]._id}`}
                  className="group block overflow-hidden rounded-3xl border"
                >
                  <img
                    src={getCarImage(cars[0])}
                    alt={
                      cars[0].title ||
                      `${cars[0].year} ${cars[0].make} ${cars[0].model}`
                    }
                    className="h-72 w-full object-cover transition duration-300 group-hover:scale-105"
                  />

                  <div className="p-5">
                    <h3 className="text-2xl font-black group-hover:text-red-600">
                      {cars[0].title ||
                        `${cars[0].year} ${cars[0].make} ${cars[0].model} ${
                          cars[0].trim || ""
                        }`.trim()}
                    </h3>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {formatMileage(cars[0].mileage)}
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        ${Number(cars[0].price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border p-10 text-center">
                  <h3 className="text-xl font-bold">Inventory coming soon</h3>
                  <p className="mt-2 text-gray-500">
                    New vehicles will be added shortly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED INVENTORY */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Inventory
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">
              {featuredCars.length > 0 ? "Featured Vehicles" : "Newest Arrivals"}
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              Shop selected used vehicles from Drive Prime Motors.
            </p>
          </div>

          <Link
            href="/inventory"
            className="rounded-2xl bg-black px-6 py-3 text-center font-bold text-white transition hover:bg-red-600"
          >
            View All Inventory
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="rounded-3xl border bg-gray-50 p-12 text-center">
            <h3 className="text-2xl font-bold">No vehicles available yet</h3>
            <p className="mt-2 text-gray-500">
              Please check back soon for new inventory.
            </p>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car: any) => {
              const price = Number(car.price || 0);
              const title =
                car.title ||
                `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim();

              return (
                <Link
                  key={car._id.toString()}
                  href={`/inventory/${car.slug || car._id}`}
                  className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative">
                    <img
                      src={getCarImage(car)}
                      alt={title}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    <div className="absolute left-4 top-4 flex gap-2">
                      {car.isFeatured && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                          Featured
                        </span>
                      )}
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-900">
                        Available
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-xl font-black group-hover:text-red-600">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      {formatMileage(car.mileage)}
                    </p>

                    <div className="mt-5 flex items-end justify-between border-t pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Internet Price
                        </p>
                        <p className="text-2xl font-black text-green-600">
                          ${price.toLocaleString()}
                        </p>
                      </div>

                      <span className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white group-hover:bg-red-600">
                        Details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* FINANCING / SELL */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-black p-10 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
              Financing
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Good Credit, Bad Credit, First-Time Buyer?
            </h2>
            <p className="mt-4 text-white/70">
              Start your financing request online and let Drive Prime Motors help
              you move forward.
            </p>
            <Link
              href="/financing"
              className="mt-8 inline-flex rounded-2xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
            >
              Apply for Financing
            </Link>
          </div>

          <div className="rounded-[2rem] border bg-white p-10 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Trade-In / Sell
            </p>
            <h2 className="mt-3 text-4xl font-black">
              Sell or Trade Your Vehicle
            </h2>
            <p className="mt-4 text-gray-600">
              Tell us about your car and get a fast offer from a local dealer.
            </p>
            <Link
              href="/sell-your-car"
              className="mt-8 inline-flex rounded-2xl bg-black px-6 py-3 font-bold text-white hover:bg-red-600"
            >
              Get an Offer
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
            Why Drive Prime Motors
          </p>
          <h2 className="mt-2 text-4xl font-black">
            A Better Way to Buy Used Cars
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Dealer Inspected Vehicles",
              text: "Every vehicle is reviewed before being listed for sale.",
            },
            {
              title: "Transparent Pricing",
              text: "Clear vehicle pricing so you can shop with confidence.",
            },
            {
              title: "Local Sacramento Dealer",
              text: "Serving Sacramento, Rancho Cordova, and surrounding areas.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border bg-white p-8 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                ✓
              </div>
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 py-20 text-center text-white">
        <h2 className="text-4xl font-black md:text-5xl">
          Ready to Find Your Next Vehicle?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-white/70">
          Browse inventory, apply for financing, or call Drive Prime Motors today.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/inventory"
            className="rounded-2xl bg-red-600 px-7 py-4 font-bold text-white hover:bg-red-700"
          >
            Browse Inventory
          </Link>

          <a
            href="tel:+19162618880"
            className="rounded-2xl border border-white/25 px-7 py-4 font-bold text-white hover:bg-white hover:text-black"
          >
            Call Now
          </a>
        </div>
      </section>
    </main>
  );
}
