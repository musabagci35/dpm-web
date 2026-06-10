import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function AdminPage() {

  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

  let totalCars = 0;

  if (!isBuild) {
    await connectDB();
    totalCars = await Car.countDocuments({});
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white border rounded-xl p-6">
            <p className="text-gray-500 text-sm">Total Vehicles</p>
            <p className="text-4xl font-bold mt-2">{totalCars}</p>
          </div>

        </div>

        <div className="flex gap-3">

          <Link
            href="/admin/inventory"
            className="border px-5 py-2 rounded-lg"
          >
            Inventory
          </Link>

          <Link
            href="/admin/offers"
            className="border px-5 py-2 rounded-lg"
          >
            Offers
          </Link>

        </div>

      </div>
    </main>
  );
}