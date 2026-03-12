"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompareBar() {

  const [cars, setCars] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {

    const handler = () => {

      const checked =
        Array.from(
          document.querySelectorAll(".compare-car:checked")
        ).map((el: any) => el.dataset.id);

      setCars(checked);

    };

    document.addEventListener("change", handler);

    return () => document.removeEventListener("change", handler);

  }, []);

  if (cars.length < 2) return null;

  return (

    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black px-6 py-3 text-white shadow-lg">

      <div className="flex items-center gap-4">

        <span>
          Compare {cars.length} vehicles
        </span>

        <button
          onClick={() => router.push(`/compare?ids=${cars.join(",")}`)}
          className="rounded bg-white px-4 py-1 text-black"
        >
          Compare
        </button>

      </div>

    </div>

  );

}