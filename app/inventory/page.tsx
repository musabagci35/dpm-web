import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import InventoryFilter from "@/components/InventoryFilter";
import SortSelect from "@/components/SortSelect";

type Props = {
  searchParams: Promise<{
    search?: string;
    make?: string;
    model?: string;
    price?: string;
    year?: string;
    mileage?: string;
    sort?: string;
  }>;
};

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatMileage(mileage?: number) {
  if (!mileage || mileage <= 0) return "Mileage unavailable";
  return `${Number(mileage).toLocaleString()} miles`;
}

function getCarImage(car: any) {
  const coverImage = car.images?.find((img: any) => img.isCover)?.url;
  const firstImage = car.images?.[0]?.url;

  if (coverImage && coverImage.startsWith("http")) return coverImage;
  if (firstImage && firstImage.startsWith("http")) return firstImage;

  return "/car.png";
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  let cars: any[] = [];

  try {
    await connectDB();

    const query: any = {
      isActive: true,
      status: { $nin: ["sold", "archived"] },
    };

    if (params.search) {
      const safe = escapeRegex(params.search);
      query.$or = [
        { title: { $regex: safe, $options: "i" } },
        { make: { $regex: safe, $options: "i" } },
        { model: { $regex: safe, $options: "i" } },
        { trim: { $regex: safe, $options: "i" } },
        { vin: { $regex: safe, $options: "i" } },
      ];
    }

    if (params.make) {
      query.make = { $regex: escapeRegex(params.make), $options: "i" };
    }

    if (params.model) {
      query.model = { $regex: escapeRegex(params.model), $options: "i" };
    }

    if (params.price && !isNaN(Number(params.price))) {
      query.price = { $lte: Number(params.price) };
    }

    if (params.year && !isNaN(Number(params.year))) {
      query.year = { $gte: Number(params.year) };
    }

    if (params.mileage && !isNaN(Number(params.mileage))) {
      query.mileage = { $lte: Number(params.mileage) };
    }

    let sortOption: any = { isFeatured: -1, createdAt: -1 };

    if (params.sort === "price-low") sortOption = { price: 1 };
    if (params.sort === "price-high") sortOption = { price: -1 };
    if (params.sort === "mileage") sortOption = { mileage: 1 };

    const carsRaw = await Car.find(query).sort(sortOption).lean();

    cars = carsRaw.map((car: any) => ({
      ...car,
      _id: car._id.toString(),
    }));
  } catch (err) {
    console.error("Inventory error:", err);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-black via-zinc-900 to-red-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-red-300">
            Drive Prime Motors
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Used Cars for Sale in Sacramento
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Browse dealer-inspected vehicles with transparent pricing, easy financing,
            and trade-in options.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-2">
              Dealer Inspected
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2">
              Financing Available
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2">
              Trade-Ins Welcome
            </span>
            <span className="rounded-full bg-white/10 px-4 py-2">
              Sacramento, CA
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <InventoryFilter />
        </div>

        <div className="mb-6 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Available Inventory
            </h2>
            <p className="text-sm text-gray-500">
              {cars.length} vehicle{cars.length === 1 ? "" : "s"} found
            </p>
          </div>

          <SortSelect currentSort={params.sort} />
        </div>

        {cars.length === 0 ? (
          <div className="rounded-3xl border bg-white p-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold">No vehicles found</h2>
            <p className="mt-2 text-gray-500">
              Try changing your search or check back soon for new arrivals.
            </p>
            <Link
              href="/inventory"
              className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-semibold text-white hover:bg-red-700"
            >
              Reset Search
            </Link>
          </div>
        ) : (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car: any) => {
              const price = Number(car.price || 0);
              const title =
                car.title ||
                `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim();

              const image = getCarImage(car);
              const vinLast = car.vin ? car.vin.slice(-6).toUpperCase() : null;

              return (
                <Link
                  key={car._id}
                  href={`/inventory/${car.slug || car._id}`}
                  className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt={title}
                      className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    <div className="absolute left-4 top-4 flex gap-2">
                      {car.isFeatured && (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                          Featured
                        </span>
                      )}

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-900 shadow">
                        Available
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-xl font-extrabold text-gray-900 group-hover:text-red-600">
                      {title}
                    </h3>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">Mileage</p>
                        <p className="font-semibold text-gray-900">
                          {formatMileage(car.mileage)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">VIN</p>
                        <p className="font-semibold text-gray-900">
                          {vinLast ? `...${vinLast}` : "Available on request"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">
                          Internet Price
                        </p>
                        <p className="text-2xl font-black text-green-600">
                          ${price.toLocaleString()}
                        </p>
                      </div>

                      <span className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition group-hover:bg-red-600">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}