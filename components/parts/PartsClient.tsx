"use client";

import { useState } from "react";
import Link from "next/link";

export default function PartsClient({ parts }: { parts: any[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filteredParts = parts.filter((part) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      part.title?.toLowerCase().includes(searchText) ||
      part.partNumber?.toLowerCase().includes(searchText) ||
      part.oemNumber?.toLowerCase().includes(searchText) ||
      part.compatibility?.toLowerCase().includes(searchText);

    const matchesCategory =
      category === "all" || part.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, part number, OEM, or compatibility..."
          className="w-full rounded-xl border p-3"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border p-3"
        >
          <option value="all">All Categories</option>
          <option value="engine">Engine</option>
          <option value="transmission">Transmission</option>
          <option value="body">Body</option>
          <option value="lighting">Lighting</option>
          <option value="wheels">Wheels</option>
          <option value="interior">Interior</option>
          <option value="electronics">Electronics</option>
          <option value="suspension">Suspension</option>
          <option value="other">Other</option>
        </select>
      </div>

      {filteredParts.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center text-gray-500">
          No matching parts found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {filteredParts.map((part) => (
            <Link
              key={part._id.toString()}
              href={`/parts/${part.slug}`}
              className="overflow-hidden rounded-2xl border bg-white transition hover:shadow-xl"
            >
              <div className="flex aspect-video items-center justify-center bg-gray-100">
                {part.images?.[0]?.url ? (
                  <img
                    src={part.images[0].url}
                    alt={part.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>

              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-gray-700">
                    {part.category || "other"}
                  </span>

                  {Number(part.quantity || 0) <= 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                      Sold Out
                    </span>
                  ) : Number(part.quantity || 0) <= 2 ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
                      Low Stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="line-clamp-2 text-lg font-semibold">
                  {part.title}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Part #: {part.partNumber || "N/A"} | OEM:{" "}
                  {part.oemNumber || "N/A"}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  {part.compatibility || "Compatibility not listed"}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    ${Number(part.price || 0).toLocaleString()}
                  </div>

                  <div className="rounded bg-black px-2 py-1 text-xs uppercase text-white">
                    {part.condition || "used"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}