import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function SimilarCars({ make, currentCarId }: { make: string; currentCarId: string }) {
  await connectDB();

  const items = await Car.find({
    isActive: true,
    make: new RegExp(`^${escapeRegex(make)}$`, "i"),
    _id: { $ne: currentCarId },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  if (!items.length) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold">Similar {make} vehicles</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((car: any) => (
          <Link key={car._id} href={`/inventory/${car._id}`} className="rounded-2xl border bg-white p-4 hover:shadow-sm">
            <div className="font-semibold">
              {car.year} {car.make} {car.model}
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {car.mileage?.toLocaleString?.() || 0} miles
            </div>
            <div className="mt-2 text-lg font-bold">${Number(car.price || 0).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}