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

  async function save() {
    try {
      setSaving(true);

      const res = await fetch(`/api/admin/cars/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...car,
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
    (car.marketing || 0) +
    (car.docFee || 0);

  const profit = (car.price || 0) - totalCost;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-sm text-gray-500">ID: {id}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/inventory/${id}`)}
            className="border px-4 py-2 rounded-xl"
          >
            View
          </button>

          <button
            onClick={save}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/price-intel`);
            const data = await res.json();
            setCar({ ...car, price: data.pricing?.retailEstimate || car.price });
          }}
          className="border p-3 rounded-xl"
        >
          💰 Price AI
        </button>

        <button
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
          className="border p-3 rounded-xl"
        >
          📝 Listing AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/photo-pack`, {
              method: "POST",
            });
            const data = await res.json();
            setImages(data.images || images);
          }}
          className="border p-3 rounded-xl"
        >
          📸 Photo AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/profit-intel`);
            const data = await res.json();
            alert(`Profit: $${data.profit}`);
          }}
          className="border p-3 rounded-xl"
        >
          📊 Profit AI
        </button>

        <button
          onClick={async () => {
            const res = await fetch(`/api/admin/cars/${id}/auction-ai`);
            const data = await res.json();
            alert(`BUY LIMIT: $${data.pricing?.buyLimit}`);
          }}
          className="border p-3 rounded-xl"
        >
          🚗 Auction AI
        </button>

        <button
          onClick={async () => {
            await fetch(`/api/admin/cars/${id}/autopilot`, { method: "POST" });
            alert("Autopilot done");
          }}
          className="border p-3 rounded-xl"
        >
          🚀 Autopilot
        </button>
      </div>

      <div className="mt-6 border rounded-xl p-4">
        <h2 className="font-bold mb-3">🚀 Multi Platform AI</h2>

        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={generateListings}
            className="border px-3 py-2 rounded"
          >
            Generate All
          </button>

          <button
            onClick={autopilotPost}
            className="bg-black text-white px-4 py-2 rounded"
          >
            POST ALL
          </button>
        </div>

        <div className="mb-4">
          <h3>📘 Facebook</h3>
          <button
            onClick={() => copyPlatform("facebook")}
            className="border px-3 py-1 rounded mt-1"
          >
            Copy
          </button>
          <textarea
            value={listings.facebook}
            readOnly
            className="w-full mt-2 border rounded p-2 min-h-[120px]"
          />
        </div>

        <div className="mb-4">
          <h3>🟢 Craigslist</h3>
          <button
            onClick={() => copyPlatform("craigslist")}
            className="border px-3 py-1 rounded mt-1"
          >
            Copy
          </button>
          <textarea
            value={listings.craigslist}
            readOnly
            className="w-full mt-2 border rounded p-2 min-h-[120px]"
          />
        </div>

        <div>
          <h3>🟠 OfferUp</h3>
          <button
            onClick={() => copyPlatform("offerup")}
            className="border px-3 py-1 rounded mt-1"
          >
            Copy
          </button>
          <textarea
            value={listings.offerup}
            readOnly
            className="w-full mt-2 border rounded p-2 min-h-[120px]"
          />
        </div>
      </div>

      <div className="mt-8 border rounded-2xl p-6 bg-white">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={car.title || ""}
            onChange={(e) => setCar({ ...car, title: e.target.value })}
            className="border p-3 rounded-xl"
            placeholder="Title"
          />

          <input
            value={car.vin || ""}
            readOnly
            className="border p-3 rounded-xl bg-gray-100"
          />

          <input
            value={car.price || 0}
            onChange={(e) =>
              setCar({ ...car, price: Number(e.target.value) })
            }
            className="border p-3 rounded-xl"
          />

          <input
            value={car.mileage || 0}
            onChange={(e) =>
              setCar({ ...car, mileage: Number(e.target.value) })
            }
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <input
            placeholder="Purchase Cost"
            className="border p-2 rounded"
            value={car.cost || 0}
            onChange={(e) => setCar({ ...car, cost: Number(e.target.value) })}
          />
          <input
            placeholder="Recon Cost"
            className="border p-2 rounded"
            value={car.recon || 0}
            onChange={(e) => setCar({ ...car, recon: Number(e.target.value) })}
          />
          <input
            placeholder="Marketing"
            className="border p-2 rounded"
            value={car.marketing || 0}
            onChange={(e) =>
              setCar({ ...car, marketing: Number(e.target.value) })
            }
          />
          <input
            placeholder="Doc Fee"
            className="border p-2 rounded"
            value={car.docFee || 0}
            onChange={(e) =>
              setCar({ ...car, docFee: Number(e.target.value) })
            }
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p>Estimated Profit</p>
          <h2 className="text-green-600 text-xl font-bold">
            ${profit.toLocaleString()}
          </h2>
        </div>

        <textarea
          value={car.description || ""}
          onChange={(e) => setCar({ ...car, description: e.target.value })}
          className="w-full mt-6 border p-3 rounded-xl"
        />

        <div className="mt-6">
          <h2 className="font-bold mb-2">Photos</h2>
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