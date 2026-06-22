"use client";

import { useState } from "react";
import PhotoManager from "@/components/admin/PhotoManager";

export default function AddCar() {
  const [loading, setLoading] = useState(false);
  const [vinLoading, setVinLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [status, setStatus] = useState("available");
  const [isFeatured, setIsFeatured] = useState(false);

  async function decodeVin() {
    const vinInput =
      document.querySelector<HTMLInputElement>('input[name="vin"]');

    const vin = vinInput?.value.trim();

    if (!vin || vin.length !== 17) {
      alert("Please enter a valid 17-character VIN");
      return;
    }

    setVinLoading(true);

    try {
      const res = await fetch("/api/vin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vin }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "VIN decode failed");
        return;
      }

      const form = document.querySelector("form") as HTMLFormElement;

      const yearInput = form.elements.namedItem(
        "year"
      ) as HTMLInputElement | null;

      const makeInput = form.elements.namedItem(
        "make"
      ) as HTMLInputElement | null;

      const modelInput = form.elements.namedItem(
        "model"
      ) as HTMLInputElement | null;

      const titleInput = form.elements.namedItem(
        "title"
      ) as HTMLInputElement | null;

      const descriptionInput = form.elements.namedItem(
        "description"
      ) as HTMLTextAreaElement | null;

      if (yearInput) yearInput.value = data.year || "";
      if (makeInput) makeInput.value = data.make || "";
      if (modelInput) modelInput.value = data.model || "";

      if (titleInput) {
        titleInput.value =
          `${data.year || ""} ${data.make || ""} ${data.model || ""}`.trim();
      }

      if (descriptionInput) {
        descriptionInput.value = `
${data.year || ""} ${data.make || ""} ${data.model || ""}

Engine: ${data.engine || "N/A"}
Fuel: ${data.fuel || "N/A"}
Body Style: ${data.body || "N/A"}

This vehicle is available now at Drive Prime Motors.
Contact us today to schedule a test drive or financing options.
        `.trim();
      }
    } catch (error) {
      console.error(error);
      alert("VIN decode failed");
    } finally {
      setVinLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const form = e.currentTarget;
const formData = new FormData(form);

const payload = {
  title: String(formData.get("title") || ""),
  vin: String(formData.get("vin") || ""),
  price: Number(formData.get("price") || 0),
  year: Number(formData.get("year") || 0),
  make: String(formData.get("make") || ""),
  model: String(formData.get("model") || ""),
  mileage: Number(formData.get("mileage") || 0),
  titleStatus: String(formData.get("titleStatus") || "unknown"),
  description: String(formData.get("description") || ""),
  videoUrl: String(formData.get("videoUrl") || ""),
  images,
  status,
  isFeatured,
};

    try {
      const res = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert("Car added 🚗");

        form.reset();
        setImages([]);
        setStatus("available");
        setIsFeatured(false);
      } else {
        alert(result.error || "Error");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Add Car</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            name="vin"
            placeholder="VIN"
            className="border p-2 w-full"
          />

          <button
            type="button"
            onClick={decodeVin}
            className="bg-blue-600 text-white px-4 rounded"
          >
            {vinLoading ? "Decoding..." : "Decode VIN"}
          </button>
        </div>

        <input
          name="title"
          placeholder="Title"
          className="border p-2 w-full"
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          className="border p-2 w-full"
        />

        <input
          name="year"
          type="number"
          placeholder="Year"
          className="border p-2 w-full"
        />

        <input
          name="make"
          placeholder="Make"
          className="border p-2 w-full"
        />

        <input
          name="model"
          placeholder="Model"
          className="border p-2 w-full"
        />

        <input
          name="mileage"
          type="number"
          placeholder="Mileage"
          className="border p-2 w-full"
        />

        <select name="titleStatus" className="border p-2 w-full">
          <option value="clean">Clean Title</option>
          <option value="salvage">Salvage Title</option>
          <option value="rebuilt">Rebuilt Title</option>
          <option value="lemon">Lemon / Buyback</option>
          <option value="unknown">Unknown</option>
        </select>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>

          <label className="border p-3 rounded-xl flex items-center gap-3">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            Featured Vehicle
          </label>
        </div>
        <input
  name="videoUrl"
  placeholder="YouTube Video URL"
  className="border p-2 w-full"
/>

        <textarea
          name="description"
          placeholder="Description"
          className="border p-2 w-full"
          rows={6}
        />

        <PhotoManager value={images} onChange={setImages} />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 w-full disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Car"}
        </button>
      </form>
    </div>
  );
}