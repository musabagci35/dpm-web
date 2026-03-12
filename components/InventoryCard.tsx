import Image from "next/image";
import Link from "next/link";

export default function InventoryCard({ car }: any) {
  const image =
    Array.isArray(car.images) && car.images.length > 0
      ? car.images[0]
      : "/car.png";

  const price = Number(car.price || 0);

  return (
    <Link
      href={`/inventory/${car._id}`}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={image}
          alt="car"
          fill
          className="object-cover group-hover:scale-105 transition"
        />
      </div>

      <div className="p-4">

        <h3 className="font-semibold text-lg">
          {car.year} {car.make} {car.model}
        </h3>

        <p className="text-gray-500 text-sm mt-1">
          {car.mileage?.toLocaleString()} miles
        </p>

        <p className="text-xl font-bold mt-3">
          ${price.toLocaleString()}
        </p>

      </div>
    </Link>
  );
}