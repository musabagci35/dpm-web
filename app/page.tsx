export const dynamic = "force-dynamic";
export const revalidate = 0;


import Link from "next/link";
import {
  ShieldCheck,
  CreditCard,
  Repeat,
  MapPin,
  Wrench,
  ArrowRight,
  Gauge,
  BadgeCheck,
  Clock,
  Phone,
  FileSearch,
} from "lucide-react";
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

function formatPrice(price?: number) {
  const value = Number(price || 0);
  if (!value || value <= 0) return "Call for Price";
  return `$${value.toLocaleString()}`;
}

function getAvailabilityBadge(status?: string) {
  if (status === "pending") {
    return { label: "Pending Sale", className: "bg-amber-500 text-white" };
  }
  return { label: "Available", className: "bg-white text-gray-900" };
}

export default async function HomePage() {
  await connectDB();

  const activeFilter = {
    isActive: true,
    status: { $nin: ["sold", "archived"] },
  };

  const [featuredCars, newestCars, activeInventoryCount] = await Promise.all([
    Car.find({ ...activeFilter, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Car.find(activeFilter).sort({ createdAt: -1 }).limit(6).lean(),
    Car.countDocuments(activeFilter),
  ]);

  const cars = featuredCars.length > 0 ? featuredCars : newestCars;

  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-red-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 opacity-25">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-600 blur-3xl" />
          <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-red-100">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Sacramento &amp; Rancho Cordova Used Car Dealer
            </p>

            <h1 className="text-5xl font-black tracking-tight md:text-7xl">
              Quality Used Cars,
              <span className="block text-red-500">Honest Prices.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
              Drive Prime Motors helps Sacramento drivers find reliable
              pre-owned vehicles with transparent pricing, easy financing,
              and trade-in support &mdash; backed by a local dealer you can trust.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 py-4 text-center font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Browse Inventory
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href="/financing"
                className="rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Financing
              </Link>

              <Link
                href="/sell-your-car"
                className="rounded-2xl border border-white/25 px-7 py-4 text-center font-bold text-white transition hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Sell or Trade Your Car
              </Link>
            </div>

            <p className="mt-5 text-sm text-white/60">
              Prefer to talk first? Call us at{" "}
              <a
                href="tel:+19162618880"
                className="font-bold text-white underline decoration-red-500 underline-offset-4 hover:text-red-300"
              >
                (916) 261-8880
              </a>
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: BadgeCheck, label: "Dealer Inspected" },
                { icon: CreditCard, label: "Financing Available" },
                { icon: Repeat, label: "Trade-Ins Welcome" },
                { icon: MapPin, label: "Sacramento, CA" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white/90"
                >
                  <Icon className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5 text-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600">
                    {activeInventoryCount > 0
                      ? `${activeInventoryCount} Vehicle${
                          activeInventoryCount === 1 ? "" : "s"
                        } In Stock`
                      : "Featured Inventory"}
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
                      <p className="text-2xl font-black text-red-600">
                        {formatPrice(cars[0].price)}
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-center font-bold text-white transition hover:bg-red-600"
          >
            View All Inventory
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
              const title =
                car.title ||
                `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim();
              const availability = getAvailabilityBadge(car.status);

              return (
                <Link
                  key={car._id.toString()}
                  href={`/inventory/${car.slug || car._id}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative">
                    <img
                      src={getCarImage(car)}
                      alt={title}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent"
                    />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      {car.isFeatured && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                          Featured
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold shadow ${availability.className}`}
                      >
                        {availability.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-2 text-xl font-black group-hover:text-red-600">
                      {title}
                    </h3>

                    <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                      <Gauge className="h-4 w-4" aria-hidden="true" />
                      {formatMileage(car.mileage)}
                    </p>

                    <div className="mt-auto flex items-end justify-between border-t pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Internet Price
                        </p>
                        <p className="text-2xl font-black text-red-600">
                          {formatPrice(car.price)}
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

      {/* FINANCING / SELL / PARTS */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              How We Help
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">
              Financing, Trade-Ins &amp; Parts
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col rounded-[2rem] bg-black p-10 text-white">
              <CreditCard className="h-10 w-10 text-red-400" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                Financing
              </p>
              <h3 className="mt-3 text-2xl font-black">
                Good Credit, Bad Credit, First-Time Buyer?
              </h3>
              <p className="mt-4 flex-1 text-white/70">
                Start your financing request online and let Drive Prime
                Motors help you move forward.
              </p>
              <Link
                href="/financing"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
              >
                Apply for Financing
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col rounded-[2rem] border bg-white p-10 shadow-sm">
              <Repeat className="h-10 w-10 text-red-600" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-red-600">
                Trade-In / Sell
              </p>
              <h3 className="mt-3 text-2xl font-black">
                Sell or Trade Your Vehicle
              </h3>
              <p className="mt-4 flex-1 text-gray-600">
                Tell us about your car and get a fast offer from a local
                dealer.
              </p>
              <Link
                href="/sell-your-car"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 font-bold text-white hover:bg-red-600"
              >
                Get an Offer
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col rounded-[2rem] border bg-white p-10 shadow-sm">
              <Wrench className="h-10 w-10 text-red-600" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-red-600">
                Auto Parts
              </p>
              <h3 className="mt-3 text-2xl font-black">
                Quality Used &amp; OEM Parts
              </h3>
              <p className="mt-4 flex-1 text-gray-600">
                Browse auto parts sourced from our inventory at competitive
                prices.
              </p>
              <Link
                href="/parts"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 font-bold text-white hover:bg-red-600"
              >
                Shop Auto Parts
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
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
              icon: ShieldCheck,
              title: "Dealer Inspected Vehicles",
              text: "Every vehicle is reviewed before being listed for sale.",
            },
            {
              icon: BadgeCheck,
              title: "Transparent Pricing",
              text: "Clear vehicle pricing so you can shop with confidence.",
            },
            {
              icon: MapPin,
              title: "Local Sacramento Dealer",
              text: "Serving Sacramento, Rancho Cordova, and surrounding areas.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black">{item.title}</h3>
              <p className="mt-3 text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LOCAL SACRAMENTO SERVICE */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
              Serving The Sacramento Area
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">
              Proudly Local in Rancho Cordova
            </h2>
            <p className="mt-4 max-w-xl text-gray-600">
              Drive Prime Motors is a Sacramento-area dealer serving Rancho
              Cordova and the surrounding communities. Stop by, call ahead,
              or reach out online &mdash; we&apos;re here to help you find
              your next vehicle.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl border bg-white p-5 shadow-sm">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-black text-gray-900">Location</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Rancho Cordova, California
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border bg-white p-5 shadow-sm">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-black text-gray-900">Hours</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Mon&ndash;Fri: 9am&ndash;6pm
                    <br />
                    Sat: By Appointment &middot; Sun: 10am&ndash;5pm
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border bg-white p-5 shadow-sm">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-black text-gray-900">Call Us</p>
                  <a
                    href="tel:+19162618880"
                    className="mt-1 block text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    (916) 261-8880
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border bg-white p-5 shadow-sm">
                <FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-black text-gray-900">VIN Reports</p>
                  <Link
                    href="/vin-report"
                    className="mt-1 block text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Check a vehicle history
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-black p-10 text-white">
            <h3 className="text-2xl font-black">Visit Drive Prime Motors</h3>
            <p className="mt-3 text-white/70">
              Have questions about a vehicle, financing, or a trade-in? Our
              team is ready to help you every step of the way.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-3 text-center font-bold text-white hover:bg-red-700"
              >
                Contact Us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="tel:+19162618880"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-6 py-3 text-center font-bold text-white hover:bg-white hover:text-black"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call Now
              </a>
            </div>
          </div>
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 py-4 font-bold text-white hover:bg-red-700"
          >
            Browse Inventory
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          <a
            href="tel:+19162618880"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-7 py-4 font-bold text-white hover:bg-white hover:text-black"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call Now
          </a>
        </div>
      </section>
    </div>
  );
}
