import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

import Section from "@/components/ui/section";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/heading";

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
      <Section className="bg-black text-white text-center">
        <Badge variant="info">Dealer Inspected</Badge>

        <h1 className="mt-4 text-5xl font-extrabold tracking-tight">
          Find Your Next Car
        </h1>

        <p className="mt-4 text-white/70 max-w-xl mx-auto">
          Shop quality used vehicles with transparent pricing.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button href="/inventory" size="lg">
            Browse Inventory
          </Button>

          <Button href="/financing" variant="outline" size="lg">
            Get Approved
          </Button>
        </div>
      </Section>

      {/* FEATURED / NEWEST INVENTORY */}
      <Section>
        <SectionHeading
          title={
            featuredCars.length > 0
              ? "Featured Vehicles"
              : "Newest Arrivals"
          }
          description={
            featuredCars.length > 0
              ? "Hand-picked inventory ready for you"
              : "Fresh vehicles recently added to our inventory"
          }
        />

        {cars.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center">
            <h3 className="text-xl font-bold">No vehicles available yet</h3>
            <p className="text-gray-500 mt-2">
              Please check back soon for new inventory.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car: any) => {
              const title =
                car.title || `${car.year} ${car.make} ${car.model}`;

              const price = Number(car.price || 0);
              const monthly = price
                ? Math.round((price * 1.15) / 60)
                : 0;
                const coverImage = car.images?.find((img: any) => img.isCover)?.url;
const firstImage = car.images?.[0]?.url;

const image =
  coverImage && coverImage.startsWith("http")
    ? coverImage
    : firstImage && firstImage.startsWith("http")
    ? firstImage
    : "/car.png";

              return (
                <Link
                  key={car._id.toString()}
                  href={`/inventory/${car.slug || car._id}`}
                  className="group rounded-2xl border bg-white overflow-hidden hover:shadow-xl transition"
                >
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-48 object-cover"
                  />

                  <div className="p-4">
                    <div className="flex gap-2 mb-2">
                      {car.isFeatured && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                          Featured
                        </span>
                      )}

                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                        Available
                      </span>
                    </div>

                    <h3 className="font-bold text-lg group-hover:text-red-600">
                      {title}
                    </h3>

                    <p className="text-green-600 font-bold mt-2">
                      ${monthly.toLocaleString()}/mo
                    </p>
                    <p className="text-xs text-gray-400">
  Estimated payment. ${price.toLocaleString()} total price
</p>

                    <p className="text-xs text-gray-400">
                      ${price.toLocaleString()} total
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <Button href="/inventory">View All Inventory</Button>
        </div>
      </Section>

      {/* WHY US */}
      <Section className="bg-gray-100">
        <SectionHeading
          title="Why Choose Us"
          description="We make buying a car simple and transparent"
          align="center"
        />

        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <h3 className="font-bold">✔ Dealer Inspected</h3>
            <p className="text-gray-600 mt-2">
              Every vehicle is checked before sale
            </p>
          </div>

          <div>
            <h3 className="font-bold">✔ Easy Financing</h3>
            <p className="text-gray-600 mt-2">
              All credit types welcome
            </p>
          </div>

          <div>
            <h3 className="font-bold">✔ No Hidden Fees</h3>
            <p className="text-gray-600 mt-2">
              Transparent pricing guaranteed
            </p>
          </div>
        </div>
      </Section>

      {/* SELL CTA */}
      <Section className="bg-black text-white text-center">
        <h2 className="text-4xl font-bold">Sell Your Car Fast</h2>

        <p className="mt-4 text-white/70">
          Get instant offers and sell your vehicle in minutes.
        </p>

        <div className="mt-6">
          <Button href="/sell-your-car" variant="primary" size="lg">
            Get Offer
          </Button>
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section className="text-center">
        <h2 className="text-4xl font-bold">Ready to Drive?</h2>

        <div className="mt-6">
          <Button href="/inventory" size="lg">
            Browse Cars
          </Button>
        </div>
      </Section>
    </main>
  );
}