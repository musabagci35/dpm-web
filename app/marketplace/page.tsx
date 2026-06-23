// ❌ "use client" YOK

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Link from "next/link";

export default async function MarketplacePage() {

  await connectDB();

  const cars = await Car.find({
    isActive: true,
    status: { $nin: ["sold", "archived"] },
  }).lean();
  return (
    <div className="max-w-6xl mx-auto p-6">

      <h1 className="text-3xl font-bold mb-6">Marketplace</h1>

      <div className="grid grid-cols-3 gap-6">
        {cars.map((car: any) => (
          <Link key={car._id} href={`/inventory/${car._id}`}>
            <div className="border p-4 rounded">
              <h2>{car.make} {car.model}</h2>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}