"use client";

import { useSearchParams } from "next/navigation";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const vin = searchParams.get("vin");

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold">VIN Result</h1>
      <p className="mt-4">VIN: {vin}</p>
    </div>
  );
}