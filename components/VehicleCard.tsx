import Link from "next/link";

type Car = any;

export default function VehicleCard({ car }: { car: Car }) {
  const img = car?.images?.[0]?.url;

  return (
    <Link
      href={`/inventory/${car._id}`}
      className="group block overflow-hidden rounded-2xl border bg-white hover:shadow-sm transition"
    >
      <div className="aspect-[16/10] bg-gray-100">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={car.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
            No photo
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="font-semibold text-lg">
          {car.year} {car.make} {car.model}
          {car.trim ? ` ${car.trim}` : ""}
        </div>

        <div className="mt-1 text-sm text-gray-600">
          {car.mileage?.toLocaleString?.() || 0} miles • {car.transmission || "—"} • {car.fuelType || "—"}
        </div>

        <div className="mt-3 text-xl font-bold">
          ${Number(car.price || 0).toLocaleString()}
        </div>
      </div>
    </Link>
  );
}