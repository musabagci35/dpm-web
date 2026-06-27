"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getUrl(img: any) {
  return typeof img === "string" ? img : img?.url || "";
}

export default function AuctionGalleryManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: any[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(images || []);
  const [saving, setSaving] = useState(false);

  async function save(nextItems: any[]) {
    setItems(nextItems);
    setSaving(true);

    await fetch("/api/auction/images/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: vehicleId, images: nextItems }),
    });

    setSaving(false);
    router.refresh();
  }

  function move(index: number, direction: "left" | "right") {
    const next = [...items];
    const target = direction === "left" ? index - 1 : index + 1;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    save(next);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    save(next);
  }

  if (!items.length) return null;

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">Gallery Manager</h2>
        <span className="text-sm font-bold text-gray-500">
          {saving ? "Saving..." : "First photo is cover"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {items.map((img, index) => {
          const url = getUrl(img);
          if (!url) return null;

          return (
            <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border bg-gray-50">
              <div className="relative">
                <img
                  src={url}
                  alt="Auction vehicle"
                  className="h-40 w-full object-cover"
                />

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">
                    COVER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 p-2">
                <button
                  type="button"
                  onClick={() => move(index, "left")}
                  className="rounded-lg bg-gray-200 px-2 py-2 text-sm font-black hover:bg-gray-300"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded-lg bg-red-600 px-2 py-2 text-sm font-black text-white hover:bg-red-700"
                >
                  Delete
                </button>

                <button
                  type="button"
                  onClick={() => move(index, "right")}
                  className="rounded-lg bg-gray-200 px-2 py-2 text-sm font-black hover:bg-gray-300"
                >
                  →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
