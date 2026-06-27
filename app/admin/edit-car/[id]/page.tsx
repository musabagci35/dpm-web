"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import CloudinaryUploader from "@/components/CloudinaryUploader";
import PhotoManager from "@/components/PhotoManager";

type Img = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

type Listings = {
  facebook: string;
  craigslist: string;
  offerup: string;
};

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [car, setCar] = useState<any>(null);
  const [images, setImages] = useState<Img[]>([]);
  const [assistant, setAssistant] = useState<any>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);

  const [listings, setListings] = useState<Listings>({
    facebook: "",
    craigslist: "",
    offerup: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/cars/${id}`);
        const data = await res.json();
        setCar(data);
        setImages(data.images || []);
      } catch (err) {
        console.error("load car error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function runDealerAssistant() {
    try {
      setAssistantLoading(true);

      const res = await fetch(`/api/admin/cars/${id}/dealer-assistant`);
      const data = await res.json();

      setAssistant(data);
    } catch (err) {
      console.error("dealer assistant error:", err);
      alert("Dealer Assistant failed");
    } finally {
      setAssistantLoading(false);
    }
  }

  async function save() {
    try {
      setSaving(true);

      const res = await fetch(`/api/admin/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...car,
          marketing:
            typeof car.marketing === "object" && car.marketing !== null
              ? car.marketing
              : {},
          images,
        }),
      });

      const data = await res.json();
      setCar(data);
    } catch (err) {
      console.error("save error:", err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  }

  const generateListings = async () => {
    try {
      const res = await fetch("/api/listing-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ car }),
      });

      const data = await res.json();

      setListings({
        facebook: data.facebook || "",
        craigslist: data.craigslist || "",
        offerup: data.offerup || "",
      });
    } catch (err) {
      console.error("generateListings error:", err);
      alert("Generate failed");
    }
  };

  const autopilotPost = async () => {
    try {
      const res = await fetch("/api/listing-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ car }),
      });

      const data = await res.json();

      const nextListings = {
        facebook: data.facebook || "",
        craigslist: data.craigslist || "",
        offerup: data.offerup || "",
      };

      setListings(nextListings);

      if (nextListings.facebook) {
        await navigator.clipboard.writeText(nextListings.facebook);
      }

      window.open("https://www.facebook.com/marketplace/create/item", "_blank");
      window.open("https://post.craigslist.org/", "_blank");
      window.open("https://offerup.com/post", "_blank");

      alert("POST ALL ready. Facebook text copied.");
    } catch (err) {
      console.error("autopilotPost error:", err);
      alert("POST ALL failed");
    }
  };

  const copyPlatform = async (type: keyof Listings) => {
    try {
      const text = listings[type] || "";

      if (!text) {
        alert("Generate first");
        return;
      }

      await navigator.clipboard.writeText(text);
      alert(`${type} copied`);
    } catch (err) {
      console.error("copy error:", err);
      alert("Copy failed");
    }
  };

  if (loading) return <div className="p-10">Loading...</div>;
  if (!car) return <div className="p-10">Car not found.</div>;

  const totalCost =
    (car.cost || 0) +
    (car.recon || 0) +
    (car.auctionFee || 0) +
    (car.transportCost || 0) +
    (car.registrationFee || 0) +
    (car.smogFee || 0) +
    (car.detailCost || 0) +
    (car.docFee || 0) +
    (car.salesTax || 0);

  const profit = (car.price || 0) - totalCost;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="rounded-xl border px-4 py-2"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/parts")}
              className="rounded-xl border px-4 py-2"
            >
              ← Parts
            </button>
          </div>

          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/inventory/${id}`)}
            className="rounded-xl border px-4 py-2"
          >
            View
          </button>

          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-black px-4 py-2 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/price-intel`);
            const data = await res.json();
            setCar({ ...car, price: data.pricing?.retailEstimate || car.price });
          }}
          className="rounded-xl border p-3"
        >
          💰 Price AI
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/auto-listing`, {
              method: "POST",
            });
            const ai = await res.json();
            setCar({
              ...car,
              title: ai.title || car.title,
              description: ai.description || car.description,
            });
          }}
          className="rounded-xl border p-3"
        >
          📝 Listing AI
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/photo-pack`, {
              method: "POST",
            });
            const data = await res.json();
            setImages(data.images || images);
          }}
          className="rounded-xl border p-3"
        >
          📸 Photo AI
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/profit-intel`);
            const data = await res.json();
            alert(`Profit: $${data.profit}`);
          }}
          className="rounded-xl border p-3"
        >
          📊 Profit AI
        </button>

        <button
          type="button"
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/auction-ai`);
            const data = await res.json();
            alert(`BUY LIMIT: $${data.pricing?.buyLimit}`);
          }}
          className="rounded-xl border p-3"
        >
          🚗 Auction AI
        </button>

        <button
          type="button"
          onClick={runDealerAssistant}
          className="rounded-xl border p-3"
        >
          🤖 Dealer Assistant
        </button>

        <button
          type="button"
          onClick={async () => {
            await fetch(`/api/admin/cars/${id}/autopilot`, { method: "POST" });
            alert("Autopilot done");
          }}
          className="rounded-xl border p-3"
        >
          🚀 Autopilot
        </button>
      </div>

      <div className="mt-6 rounded-xl border p-4">
        <h2 className="mb-3 font-bold">🚀 Multi Platform AI</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generateListings}
            className="rounded border px-3 py-2"
          >
            Generate All
          </button>

          <button
            type="button"
            onClick={autopilotPost}
            className="rounded bg-black px-4 py-2 text-white"
          >
            POST ALL
          </button>
        </div>

        <div className="mb-4">
          <h3>📘 Facebook</h3>
          <button
            type="button"
            onClick={() => copyPlatform("facebook")}
            className="mt-1 rounded border px-3 py-1"
          >
            Copy
          </button>
          <textarea
            value={listings.facebook}
            readOnly
            className="mt-2 min-h-[120px] w-full rounded border p-2"
          />
        </div>

        <div className="mb-4">
          <h3>🟢 Craigslist</h3>
          <button
            type="button"
            onClick={() => copyPlatform("craigslist")}
            className="mt-1 rounded border px-3 py-1"
          >
            Copy
          </button>
          <textarea
            value={listings.craigslist}
            readOnly
            className="mt-2 min-h-[120px] w-full rounded border p-2"
          />
        </div>

        <div>
          <h3>🟠 OfferUp</h3>
          <button
            type="button"
            onClick={() => copyPlatform("offerup")}
            className="mt-1 rounded border px-3 py-1"
          >
            Copy
          </button>
          <textarea
            value={listings.offerup}
            readOnly
            className="mt-2 min-h-[120px] w-full rounded border p-2"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={car.title || ""}
            onChange={(e) => setCar({ ...car, title: e.target.value })}
            className="rounded-xl border p-3"
            placeholder="Title"
          />

          <input
            value={car.vin || ""}
            readOnly
            className="rounded-xl border bg-gray-100 p-3"
            placeholder="VIN"
          />
<select
  value={car.titleStatus || "unknown"}
  onChange={(e) =>
    setCar({ ...car, titleStatus: e.target.value })
  }
  className="rounded-xl border p-3"
>
  <option value="unknown">Unknown Title</option>
  <option value="clean">Clean Title</option>
  <option value="salvage">Salvage Title</option>
  <option value="rebuilt">Rebuilt Title</option>
  <option value="parts_only">Parts Only</option>
</select>

<input
  value={car.titleCode || ""}
  onChange={(e) =>
    setCar({ ...car, titleCode: e.target.value })
  }
  className="rounded-xl border p-3"
  placeholder="Title Code (CA - Salvage Certificate)"
/>
          <input
            value={car.price || 0}
            onChange={(e) => setCar({ ...car, price: Number(e.target.value) })}
            className="rounded-xl border p-3"
            placeholder="Price"
          />

          <input
            value={car.mileage || 0}
            onChange={(e) => setCar({ ...car, mileage: Number(e.target.value) })}
            className="rounded-xl border p-3"
            placeholder="Mileage"
          />
        </div>
        <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
  <h2 className="mb-4 text-xl font-black">🏁 Auction Information</h2>

  <div className="grid gap-4 md:grid-cols-2">
    <select
      value={car.auctionHouse || ""}
      onChange={(e) => setCar({ ...car, auctionHouse: e.target.value })}
      className="rounded-xl border p-3"
    >
      <option value="">Auction House</option>
      <option value="copart">Copart</option>
      <option value="manheim">Manheim</option>
      <option value="iaai">IAAI</option>
    </select>

    <input
      value={car.lotNumber || ""}
      onChange={(e) => setCar({ ...car, lotNumber: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Lot Number"
    />

    <select
      value={car.titleStatus || "unknown"}
      onChange={(e) => setCar({ ...car, titleStatus: e.target.value })}
      className="rounded-xl border p-3"
    >
      <option value="unknown">Unknown Title</option>
      <option value="clean">Clean Title</option>
      <option value="salvage">Salvage Title</option>
      <option value="rebuilt">Rebuilt Title</option>
      <option value="parts_only">Parts Only</option>
    </select>

    <input
      value={car.titleCode || ""}
      onChange={(e) => setCar({ ...car, titleCode: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Title Code ex: CA - Salvage Certificate"
    />

    <input
      value={car.primaryDamage || ""}
      onChange={(e) => setCar({ ...car, primaryDamage: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Primary Damage ex: Front End"
    />

    <input
      value={car.secondaryDamage || ""}
      onChange={(e) => setCar({ ...car, secondaryDamage: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Secondary Damage ex: Side"
    />

    <input
      value={car.odometerStatus || ""}
      onChange={(e) => setCar({ ...car, odometerStatus: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Odometer Status ex: Actual"
    />

    <input
      value={car.estimatedRetailValue || 0}
      onChange={(e) =>
        setCar({ ...car, estimatedRetailValue: Number(e.target.value) })
      }
      className="rounded-xl border p-3"
      placeholder="Estimated Retail Value"
    />

    <input
      value={car.saleDate || ""}
      onChange={(e) => setCar({ ...car, saleDate: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Sale Date"
    />

    <input
      value={car.location || ""}
      onChange={(e) => setCar({ ...car, location: e.target.value })}
      className="rounded-xl border p-3"
      placeholder="Auction Location ex: CA - Sacramento"
    />
  </div>

  <div className="mt-4 grid gap-3 md:grid-cols-3">
    <label className="flex items-center gap-2 rounded-xl border bg-white p-3">
      <input
        type="checkbox"
        checked={!!car.runAndDrive}
        onChange={(e) => setCar({ ...car, runAndDrive: e.target.checked })}
      />
      Run & Drive
    </label>

    <label className="flex items-center gap-2 rounded-xl border bg-white p-3">
      <input
        type="checkbox"
        checked={!!car.engineStarts}
        onChange={(e) => setCar({ ...car, engineStarts: e.target.checked })}
      />
      Engine Starts
    </label>

    <label className="flex items-center gap-2 rounded-xl border bg-white p-3">
      <input
        type="checkbox"
        checked={!!car.transmissionEngages}
        onChange={(e) =>
          setCar({ ...car, transmissionEngages: e.target.checked })
        }
      />
      Transmission Engages
    </label>
  </div>
</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Purchase Cost"
            className="rounded border p-2"
            value={car.cost || 0}
            onChange={(e) => setCar({ ...car, cost: Number(e.target.value) })}
          />

          <input
            placeholder="Recon Cost"
            className="rounded border p-2"
            value={car.recon || 0}
            onChange={(e) => setCar({ ...car, recon: Number(e.target.value) })}
          />

          <input
            placeholder="Auction Fee"
            className="rounded border p-2"
            value={car.auctionFee || 0}
            onChange={(e) =>
              setCar({ ...car, auctionFee: Number(e.target.value) })
            }
          />

          <input
            placeholder="Transport Cost"
            className="rounded border p-2"
            value={car.transportCost || 0}
            onChange={(e) =>
              setCar({ ...car, transportCost: Number(e.target.value) })
            }
          />

          <input
            placeholder="Registration Fee"
            className="rounded border p-2"
            value={car.registrationFee || 0}
            onChange={(e) =>
              setCar({ ...car, registrationFee: Number(e.target.value) })
            }
          />

          <input
            placeholder="Smog Fee"
            className="rounded border p-2"
            value={car.smogFee || 0}
            onChange={(e) =>
              setCar({ ...car, smogFee: Number(e.target.value) })
            }
          />

          <input
            placeholder="Detail Cost"
            className="rounded border p-2"
            value={car.detailCost || 0}
            onChange={(e) =>
              setCar({ ...car, detailCost: Number(e.target.value) })
            }
          />

          <input
            placeholder="Doc Fee"
            className="rounded border p-2"
            value={car.docFee || 0}
            onChange={(e) => setCar({ ...car, docFee: Number(e.target.value) })}
          />

          <input
            placeholder="Sales Tax"
            className="rounded border p-2"
            value={car.salesTax || 0}
            onChange={(e) => setCar({ ...car, salesTax: Number(e.target.value) })}
          />
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p>Total Investment</p>
          <h2 className="text-xl font-bold text-gray-900">
            ${totalCost.toLocaleString()}
          </h2>

          <p className="mt-3">Estimated Profit</p>
          <h2 className="text-xl font-bold text-green-600">
            ${profit.toLocaleString()}
          </h2>
        </div>

        <div className="mt-6 rounded-2xl border bg-black p-5 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">🤖 AI Dealer Assistant</h2>

            <button
              type="button"
              onClick={runDealerAssistant}
              className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-black"
            >
              {assistantLoading ? "Thinking..." : "Run"}
            </button>
          </div>

          {!assistant ? (
            <p className="mt-4 text-sm text-gray-300">
              Run assistant to get BUY / PASS recommendation.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-white p-4 text-black">
                <p className="text-sm text-gray-500">Recommendation</p>
                <h3 className="text-3xl font-black">
                  {assistant.recommendation === "BUY" ? "🟢 BUY" : "🔴 PASS"}
                </h3>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
  <p className="text-xs text-gray-300">Title</p>
  <h3 className="text-xl font-bold">
    {assistant.titleStatus?.toUpperCase() || "UNKNOWN"}
  </h3>
  {assistant.titleCode && (
    <p className="mt-1 text-xs text-gray-300">{assistant.titleCode}</p>
  )}
</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Confidence</p>
                  <h3 className="text-xl font-bold">{assistant.confidence}%</h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Max Bid</p>
                  <h3 className="text-xl font-bold">
                    ${assistant.maxBid?.toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Repair</p>
                  <h3 className="text-xl font-bold">
                    ${assistant.repairEstimate?.toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Shipping</p>
                  <h3 className="text-xl font-bold">
                    ${assistant.shippingEstimate?.toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Investment</p>
                  <h3 className="text-xl font-bold">
                    ${assistant.totalInvestment?.toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Profit</p>
                  <h3 className="text-xl font-bold">
                    ${assistant.expectedProfit?.toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">ROI</p>
                  <h3 className="text-xl font-bold">{assistant.roi}%</h3>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-gray-300">Risk</p>
                  <h3 className="text-xl font-bold">{assistant.risk}</h3>
                </div>
              </div>

              {assistant.notes?.length > 0 && (
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="mb-2 text-sm font-bold">Why?</p>
                  <ul className="space-y-1 text-sm text-gray-200">
                    {assistant.notes.map((note: string, i: number) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          value={car.videoUrl || ""}
          onChange={(e) => setCar({ ...car, videoUrl: e.target.value })}
          placeholder="YouTube Video URL"
          className="mt-4 w-full rounded-xl border p-3"
        />

        <textarea
          value={car.description || ""}
          onChange={(e) => setCar({ ...car, description: e.target.value })}
          className="mt-6 w-full rounded-xl border p-3"
          placeholder="Description"
        />

        <div className="mt-6">
          <h2 className="mb-2 font-bold">Photos</h2>
          <PhotoManager value={images} onChange={setImages} />
        </div>

        <div className="mt-4">
          <CloudinaryUploader
            onUploaded={(files: Img[]) => {
              const next = [...images, ...files];

              if (next.length > 0 && !next.some((img) => img.isCover)) {
                next[0].isCover = true;
              }

              setImages(next);
            }}
          />
        </div>
      </div>
    </div>
  );
}
