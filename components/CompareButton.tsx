"use client";

import { useCompare } from "./CompareContext";

export default function CompareButton({ car }: any) {

  const { addCar } = useCompare();

  return (
    <button
      onClick={() => addCar(car)}
      className="text-xs border px-3 py-1 rounded hover:bg-gray-100"
    >
      Compare
    </button>
  );
}