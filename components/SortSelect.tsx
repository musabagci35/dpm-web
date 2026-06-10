"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ currentSort }: { currentSort?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/inventory?${params.toString()}`);
  };

  return (
    <select
      value={currentSort || "newest"}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border px-3 py-2 text-sm"
    >
      <option value="newest">Newest</option>
      <option value="price-low">Price Low → High</option>
      <option value="price-high">Price High → Low</option>
      <option value="mileage">Lowest Mileage</option>
    </select>
  );
}