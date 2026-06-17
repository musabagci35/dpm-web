"use client";

import { useState } from "react";
import PartPhotoManager from "@/components/admin/PartPhotoManager";

export default function AddPartPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      title: String(formData.get("title") || ""),
      partNumber: String(formData.get("partNumber") || ""),
      oemNumber: String(formData.get("oemNumber") || ""),
      condition: String(formData.get("condition") || "used"),
      compatibility: String(
        formData.get("compatibility") || ""
      ),
      ebayUrl: String(formData.get("ebayUrl") || ""),
      price: Number(formData.get("price") || 0),
      quantity: Number(formData.get("quantity") || 1),
      description: String(
        formData.get("description") || ""
      ),
      images,
      isActive: true,
    };

    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert("Part added ✅");

        form.reset();
        setImages([]);
      } else {
        alert(result.error || "Error");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl p-10">
      <h1 className="mb-6 text-2xl font-bold">
        Add Part
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          name="title"
          placeholder="Part Title"
          className="w-full border p-2"
        />

        <input
          name="partNumber"
          placeholder="Part Number"
          className="w-full border p-2"
        />

        <input
          name="oemNumber"
          placeholder="OEM Number"
          className="w-full border p-2"
        />
        <input
  name="ebayUrl"
  placeholder="eBay Listing URL"
  className="w-full border p-2"
/>

        <input
          name="compatibility"
          placeholder="Fits: 2017-2020 Chevy Colorado"
          className="w-full border p-2"
        />

        <select
          name="condition"
          className="w-full border p-2"
        >
          <option value="used">Used</option>
          <option value="new">New</option>
          <option value="rebuilt">Rebuilt</option>
          <option value="unknown">Unknown</option>
        </select>

        <input
  name="price"
  type="number"
  step="0.01"
  placeholder="Price"
  className="w-full border p-2"
/>

        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          defaultValue={1}
          className="w-full border p-2"
        />

        <textarea
          name="description"
          placeholder="Description"
          className="w-full border p-2"
          rows={6}
        />

        <PartPhotoManager
          value={images}
          onChange={setImages}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add Part"}
        </button>
      </form>
    </div>
  );
}