"use client";

import Link from "next/link";
import { useCompare } from "./CompareContext";

export default function FloatingCompareBar() {

  const { compareCars, removeCar, clearCars } = useCompare();

  if (!compareCars || compareCars.length === 0) return null;

  return (

    <div className="fixed bottom-0 left-0 right-0 bg-black text-white shadow-lg z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* CAR LIST */}
        <div className="flex items-center gap-4">

          {compareCars.map((car: any) => (

            <div
              key={car._id}
              className="bg-gray-900 px-3 py-2 rounded flex items-center gap-2"
            >

              <span className="text-sm">
                {car.year} {car.make}
              </span>

              <button
                onClick={() => removeCar(car._id)}
                className="text-red-400 text-xs"
              >
                ✕
              </button>

            </div>

          ))}

        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          <button
            onClick={clearCars}
            className="text-sm text-gray-300 hover:underline"
          >
            Clear
          </button>

          <Link
            href="/compare"
            className="bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
          >
            Compare ({compareCars.length})
          </Link>

        </div>

      </div>

    </div>

  );
}