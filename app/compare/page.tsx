"use client";

import { useCompare } from "@/components/CompareContext";

export default function ComparePage() {

  const { compareCars } = useCompare();

  if (!compareCars.length) {
    return (
      <div className="py-20 text-center">
        No vehicles selected for comparison.
      </div>
    );
  }

  return (

    <div className="max-w-6xl mx-auto py-16">

      <h1 className="text-3xl font-bold mb-10">
        Compare Vehicles
      </h1>

      <div className="grid grid-cols-3 gap-8">

        {compareCars.map((car:any) => (

          <div key={car._id} className="border rounded-xl p-6">

            <h3 className="font-bold mb-4">
              {car.year} {car.make} {car.model}
            </h3>

            <p className="text-lg font-semibold">
              ${Number(car.price).toLocaleString()}
            </p>

            <p>Mileage: {car.mileage?.toLocaleString()} miles</p>

            <p>VIN: {car.vin}</p>

          </div>

        ))}

      </div>

    </div>

  );
}