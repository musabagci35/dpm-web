import Image from "next/image";
import Link from "next/link";

export default function InventoryCard({ car }: any) {
  const firstImage =
    Array.isArray(car.images) && car.images.length > 0
      ? car.images[0]
      : null;

  const image =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.url || "/car.png";

  const price = Number(car.price || 0);

  return (
    <Link
      href={`/inventory/${car._id}`}
      className="group block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-52 w-full overflow-hidden bg-gray-100">
        <Image
          src={image}
          alt={`${car.year || ""} ${car.make || ""} ${car.model || ""}`}
          fill
          className="object-cover transition group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">
          {car.year} {car.make} {car.model}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {Number(car.mileage || 0).toLocaleString()} miles
        </p>

        <p className="mt-3 text-xl font-bold">
          ${price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
