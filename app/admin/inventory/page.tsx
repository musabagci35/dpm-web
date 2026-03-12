import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Link from "next/link";
import RemoveCarButton from "@/components/RemoveCarButton";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: Props) {

  await connectDB();

  const params = await searchParams;
  const status = params?.status;

  let filter: any = {};

  if (status === "draft") {
    filter.isActive = false;
  }

  if (status === "live") {
    filter.isActive = true;
  }

  const cars: any = await Car.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  return (

    <div className="mx-auto max-w-6xl px-6 py-10">

      <h1 className="text-3xl font-bold mb-6">
        Inventory Manager
      </h1>

      {cars.length === 0 && (
        <div className="border rounded-xl p-6 text-sm text-gray-500">
          No vehicles found.
        </div>
      )}

      <div className="space-y-4">

        {cars.map((car: any) => {

          const id = car._id.toString();

          return (

            <div
              key={id}
              className="border rounded-xl p-4 flex items-center justify-between bg-white"
            >

              <div>

                <div className="font-semibold">
                  {car.year} {car.make} {car.model}
                </div>

                <div className="text-sm text-gray-600">
                  VIN: {car.vin || "—"}
                </div>
                {car.vin && (
  <Link
    href={`/vin/${car.vin}`}
    className="text-blue-600 text-xs underline"
  >
    VIN Report
  </Link>
)}

              </div>

              <div className="flex gap-2">

                <Link
                  href={`/admin/edit-car/${id}`}
                  className="border px-3 py-1 text-xs rounded hover:bg-gray-50"
                >
                  Edit
                </Link>

                <Link
                  href={`/inventory/${id}`}
                  className="border px-3 py-1 text-xs rounded hover:bg-gray-50"
                >
                  View
                </Link>

                <RemoveCarButton id={id} />

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}