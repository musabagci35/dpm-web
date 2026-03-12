import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

type Props = {
  make: string;
  currentCarId: string;
};

export default async function SimilarCars({ make, currentCarId }: Props) {
  await connectDB();

  const cars = await Car.find({
    make,
    _id: { $ne: currentCarId },
  })
    .limit(3)
    .lean();

  if (!cars.length) return null;

  return (
    <div className="mt-20">
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car: any) => {
          const id = car._id.toString();
          const title = `${car.year} ${car.make} ${car.model}`;
          const img = car.images?.[0] || car.image || "/car.png";

          return (
            <Link
              key={id}
              href={`/inventory/${id}`}
              className="border rounded-2xl overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative h-48">
                <Image
                  src={img}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4">
                <h3 className="font-semibold">{title}</h3>

                <p className="text-red-600 font-bold mt-2">
                  ${Number(car.price).toLocaleString()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

