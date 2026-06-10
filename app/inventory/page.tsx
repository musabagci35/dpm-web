import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import InventoryFilter from "@/components/InventoryFilter";
import SortSelect from "@/components/SortSelect";

// ✅ TYPE (Next 15 uyumlu)
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

// ✅ REGEX SAFE
function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    // 🔍 SEARCH
    if (params.search) {
      const safe = escapeRegex(params.search);
      query.$or = [
        { make: { $regex: safe, $options: "i" } },
        { model: { $regex: safe, $options: "i" } },
      ];
    }

    // 🔧 FILTERS
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

    // 🔄 SORT
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
      {/* HEADER */}
      <section className="bg-black py-14 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-4xl font-bold">Available Inventory</h1>
          <p className="mt-2 text-white/70">
            Browse vehicles from Drive Prime Motors
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <InventoryFilter />

        {/* SORT */}
        <div className="mb-6 mt-6 flex justify-between">
          <p className="text-sm text-gray-500">
            {cars.length} vehicles found
          </p>

          <SortSelect currentSort={params.sort} />
        </div>

        {/* EMPTY */}
        {cars.length === 0 ? (
          <div className="bg-white p-10 text-center rounded">
            <h2>No vehicles found</h2>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car: any) => {
              const price = Number(car.price || 0);
              const title = `${car.year} ${car.make} ${car.model}`;
              const firstImage = car.images?.[0]?.url;

              const image =
                firstImage && firstImage.startsWith("http")
                  ? firstImage
                  : "/car.png";

              return (
                <div key={car._id} className="bg-white p-4 rounded shadow">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-48 object-cover"
                  />
{car.isFeatured && (
  <span className="inline-block mt-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
    Featured
  </span>
)}

                  <h3 className="mt-3 font-bold">{title}</h3>

                  <p className="text-green-600 font-bold">
                    ${price.toLocaleString()}
                  </p>

                  <Link
                   href={`/inventory/${car.slug || car._id}`}
                    className="block mt-3 bg-black text-white text-center py-2 rounded"
                  >
                    View Details
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}