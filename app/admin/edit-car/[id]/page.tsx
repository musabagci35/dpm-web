"use client";
import DealerBrainPro from "@/components/DealerBrainPro";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CloudinaryUploader from "@/components/CloudinaryUploader";
import AuctionPanel from "@/components/AuctionPanel";
import DealerIntelligence from "@/components/DealerIntelligence";
import LiveAuctionScanner from "@/components/LiveAuctionScanner";
import VINBrainPanel from "@/components/VINBrainPanel";

type Img = { url: string; publicId?: string };

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [car, setCar] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;

      const res = await fetch(`/api/admin/cars/${id}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load car");
        setLoading(false);
        return;
      }

      setCar(data);
      setLoading(false);
    })();
  }, [id]);

  async function save() {
    if (!car) return;

    setSaving(true);

    const res = await fetch(`/api/admin/cars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: car.title,
        price: Number(car.price || 0),
        mileage: Number(car.mileage || 0),
        description: car.description,
        isActive: !!car.isActive,
        images: car.images || [],
        cost: Number(car.cost || 0),
        recon: Number(car.recon || 0),
        marketing: Number(car.marketing || 0),
        docFee: Number(car.docFee || 0),
      }),
    });

    const data = await res.json();

    if (!res.ok) alert(data?.error || "Save failed");
    else setCar(data);

    setSaving(false);
  }

  if (loading) return <div className="p-10">Loading...</div>;
  if (!car) return <div className="p-10">Not found</div>;

  const totalCost =
    (car.cost || 0) +
    (car.recon || 0) +
    (car.marketing || 0) +
    (car.docFee || 0);

  const profit = (car.price || 0) - totalCost;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-sm text-gray-600">Draft → edit → publish</p>
          <p className="text-xs text-gray-500">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/inventory/${id}`)}
            className="rounded-xl border px-4 py-2"
          >
            View
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* AI PANEL */}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/price-intel`, {
              cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) return alert(data?.error || "Price AI failed");

            setCar((prev: any) => ({
              ...prev,
              price: data.pricing?.retailEstimate ?? prev.price,
            }));

            alert(
              `Suggested price: $${Number(
                data.pricing?.retailEstimate || 0
              ).toLocaleString()}`
            );
          }}
          className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
        >
          💰 Price AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/auto-listing`, {
              method: "POST",
              cache: "no-store",
            });

            const ai = await res.json();
            if (!res.ok) return alert(ai?.error || "Listing AI failed");

            const bullets = (ai.bullets || [])
              .map((b: string) => `• ${b}`)
              .join("\n");

            setCar((prev: any) => ({
              ...prev,
              title: ai.title || prev.title,
              description:
                `${ai.subtitle ? ai.subtitle + "\n\n" : ""}` +
                `${bullets ? bullets + "\n\n" : ""}` +
                `${ai.description || prev.description || ""}`.trim(),
            }));

            alert(`Listing ready (${ai.mode || "ok"})`);
          }}
          className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
        >
          📝 Listing AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/photo-pack`, {
              method: "POST",
            });

            const data = await res.json();
            if (!res.ok) return alert(data?.error || "Photo AI failed");

            setCar((prev: any) => ({
              ...prev,
              images: data.images || prev.images,
            }));

            alert(`Photo pack created (${data.count || 0})`);
          }}
          className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
        >
          📸 Photo AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/profit-intel`, {
              cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) return alert(data?.error || "Profit AI failed");

            alert(
              `Total Cost: $${Number(data.totalCost || 0).toLocaleString()}\n` +
                `Suggested Retail: $${Number(
                  data.suggestedRetail || 0
                ).toLocaleString()}\n` +
                `Current Profit: $${Number(data.profit || 0).toLocaleString()}`
            );
          }}
          className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
        >
          📊 Profit AI
        </button>
        <button
  onClick={async () => {
    const res = await fetch(`/api/admin/cars/${id}/auction-ai`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Auction AI failed");
      return;
    }

    alert(
      `Auction Value: $${Number(data.pricing.estimatedAuctionValue || 0).toLocaleString()}\n` +
      `Buy Limit: $${Number(data.pricing.buyLimit || 0).toLocaleString()}\n` +
      `Expected Profit: $${Number(data.pricing.expectedProfit || 0).toLocaleString()}\n` +
      `Recommendation: ${data.decision.recommendation}\n` +
      `Risk Score: ${data.decision.riskScore}`
    );
  }}
  className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
>
  🚗 Auction AI
</button>
        <button
  onClick={async () => {
    const res = await fetch(`/api/admin/cars/${id}/autopilot`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Autopilot failed");
      return;
    }

    setCar((prev: any) => ({
      ...prev,
      isActive: true,
    }));

    alert("Autopilot completed 🚀");
  }}
  className="rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
>
  🚀 Run Autopilot
</button>
      </div>

      {/* FORM */}
      <div className="mt-8 grid gap-6">
        <div className="rounded-2xl border bg-white p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <div className="text-xs text-gray-500">Title</div>
              <input
                value={car.title || ""}
                onChange={(e) => setCar({ ...car, title: e.target.value })}
                className="w-full rounded-xl border px-4 py-3"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">VIN</div>
              <input
                value={car.vin || ""}
                readOnly
                className="w-full rounded-xl border px-4 py-3 bg-gray-50"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">Price</div>
              <input
                value={car.price ?? 0}
                onChange={(e) =>
                  setCar({ ...car, price: Number(e.target.value) })
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </label>

            <label>
              <div className="text-xs text-gray-500">Mileage</div>
              <input
                value={car.mileage ?? 0}
                onChange={(e) =>
                  setCar({ ...car, mileage: Number(e.target.value) })
                }
                className="w-full rounded-xl border px-4 py-3"
              />
            </label>
          </div>

          {/* COSTS */}
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <input
              type="number"
              placeholder="Purchase Cost"
              value={car.cost || ""}
              onChange={(e) => setCar({ ...car, cost: Number(e.target.value) })}
              className="border rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Recon Cost"
              value={car.recon || ""}
              onChange={(e) => setCar({ ...car, recon: Number(e.target.value) })}
              className="border rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Marketing Cost"
              value={car.marketing || ""}
              onChange={(e) =>
                setCar({ ...car, marketing: Number(e.target.value) })
              }
              className="border rounded-lg p-2"
            />

            <input
              type="number"
              placeholder="Doc Fee"
              value={car.docFee || ""}
              onChange={(e) =>
                setCar({ ...car, docFee: Number(e.target.value) })
              }
              className="border rounded-lg p-2"
            />
          </div>

          {/* PROFIT PANEL */}
          <div className="mt-6 p-4 border rounded-xl bg-gray-50">
            <div className="text-sm text-gray-600">Estimated Profit</div>

            <div
              className={`text-2xl font-bold ${
                profit > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Number(profit || 0).toLocaleString()}
            </div>

            <div className="mt-1 text-xs text-gray-600">
              Total cost: ${Number(totalCost || 0).toLocaleString()}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-1">Description</div>
            <textarea
              value={car.description || ""}
              onChange={(e) => setCar({ ...car, description: e.target.value })}
              className="w-full min-h-[160px] rounded-xl border px-4 py-3"
            />
          </div>

          {/* PUBLISH */}
          <div className="mt-4 flex items-center justify-between rounded-xl border bg-gray-50 p-3">
            <div>
              <div className="font-semibold">Publish</div>
              <div className="text-xs text-gray-600">
                Enable to show in inventory
              </div>
            </div>

            <input
              type="checkbox"
              checked={!!car.isActive}
              onChange={(e) => setCar({ ...car, isActive: e.target.checked })}
              className="h-5 w-5"
            />
          </div>
        </div>
        
        {/* UPLOADER */}
        <VINBrainPanel carId={id} />
        <DealerIntelligence carId={id} />
        <DealerBrainPro carId={id} />
        
        <CloudinaryUploader
          onUploaded={(files: Img[]) => {
            const next = [...(car.images || [])];
            for (const f of files) next.push(f);
            setCar({ ...car, images: next });
          }}
        />

        {/* CURRENT IMAGES */}
        {!!car.images?.length && (
          <div className="rounded-2xl border bg-white p-4">
            <div className="font-semibold">Current Images</div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {car.images.map((img: Img, idx: number) => (
                <img
                  key={idx}
                  src={img.url}
                  alt="vehicle photo"
                  className="w-full rounded-xl border object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}