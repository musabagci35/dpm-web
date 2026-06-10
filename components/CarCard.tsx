"use client";

import Link from "next/link";

export default function CarCard({ car }: any) {
  const href = `/inventory/${car.slug || car._id}`;

  const image =
    car.image ||
    car.images?.find((img: any) => img.isCover)?.url ||
    car.images?.[0]?.url ||
    "/car.png";

  return (
    <Link
      href={href}
      className="border rounded-xl overflow-hidden hover:shadow-lg transition"
    >
      <img
        src={image}
        alt={car.title || `${car.year} ${car.make} ${car.model}`}
        className="w-full h-48 object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/car.png";
        }}
      />

      <div className="p-4">
        <h2 className="font-bold">
          {car.title || `${car.year} ${car.make} ${car.model}`}
        </h2>

        <p className="text-gray-500">
          ${Number(car.price || 0).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}