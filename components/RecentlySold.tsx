import Link from "next/link";
import { Gauge } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

function getCarImage(car: any) {
  const coverImage = car.images?.find((img: any) => img.isCover)?.url;
  const firstImage = car.images?.[0]?.url;

  if (coverImage && coverImage.startsWith("http")) return coverImage;
  if (firstImage && firstImage.startsWith("http")) return firstImage;

  return "/no-photo.svg";
}

function formatMileage(mileage?: number) {
  if (!mileage || mileage <= 0) return "Mileage unavailable";
  return `${Number(mileage).toLocaleString()} miles`;
}

export default async function RecentlySold() {
  await connectDB();

  const soldCars = await Car.find({ status: "sold" })
    .sort({ updatedAt: -1 })
    .limit(6)
    .select("year make model trim mileage images slug title")
    .lean();

  if (soldCars.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-600">
          Sold Vehicles
        </p>
        <h2 className="mt-2 text-4xl font-black tracking-tight">
          Recently Sold
        </h2>
        <p className="mt-3 max-w-2xl text-gray-600">
          A look at vehicles Drive Prime Motors has recently sold.
        </p>
      </div>

      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {soldCars.map((car: any) => {
          const title =
            car.title ||
            `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim();

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
                  className="h-56 w-full object-cover grayscale-[35%] transition duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent"
                />

                <div className="absolute left-4 top-4">
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Sold
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
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
