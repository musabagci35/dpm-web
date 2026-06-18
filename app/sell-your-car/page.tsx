"use client";

import React, { useState } from "react";

export default function SellYourCarPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    mileage: "",
    price: "",
    message: "",
  });

  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImages: string[] = [];

      if (images && images.length > 0) {
        const fd = new FormData();

        for (let i = 0; i < images.length; i++) {
          fd.append("files", images[i]);
        }

        const upload = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        if (!upload.ok) {
          throw new Error("Image upload failed");
        }

        const img = await upload.json();
        uploadedImages = img.images || [];
      }

      const res = await fetch("/api/sell-your-car", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          images: uploadedImages,
          source: "sell-your-car",
          status: "new-lead",
        }),
      });

      if (!res.ok) {
        throw new Error("Submit failed");
      }

      alert("Thank you! Your vehicle was submitted successfully.");

      setForm({
        name: "",
        phone: "",
        email: "",
        vin: "",
        year: "",
        make: "",
        model: "",
        mileage: "",
        price: "",
        message: "",
      });

      setImages(null);
    } catch (error) {
      alert("Error submitting vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Sell Your Car</h1>

      <p className="mb-6 text-gray-600">
        Tell us about your vehicle. We will review the information and contact
        you with the next step.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          name="name"
          value={form.name}
          placeholder="Your Name"
          onChange={handleChange}
          required
          className="rounded-xl border px-4 py-3"
        />

        <input
          name="phone"
          value={form.phone}
          placeholder="Phone Number"
          onChange={handleChange}
          required
          className="rounded-xl border px-4 py-3"
        />

        <input
          name="email"
          value={form.email}
          type="email"
          placeholder="Email Address"
          onChange={handleChange}
          className="rounded-xl border px-4 py-3"
        />

        <input
          name="vin"
          value={form.vin}
          placeholder="VIN Number"
          onChange={handleChange}
          className="rounded-xl border px-4 py-3"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="year"
            value={form.year}
            placeholder="Year"
            onChange={handleChange}
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="make"
            value={form.make}
            placeholder="Make"
            onChange={handleChange}
            className="rounded-xl border px-4 py-3"
          />

          <input
            name="model"
            value={form.model}
            placeholder="Model"
            onChange={handleChange}
            className="rounded-xl border px-4 py-3"
          />
        </div>

        <input
          name="mileage"
          value={form.mileage}
          placeholder="Mileage"
          onChange={handleChange}
          className="rounded-xl border px-4 py-3"
        />

        <input
          name="price"
          value={form.price}
          placeholder="Asking Price"
          onChange={handleChange}
          className="rounded-xl border px-4 py-3"
        />

        <textarea
          name="message"
          value={form.message}
          placeholder="Tell us about your car, condition, title status, problems, or upgrades"
          onChange={handleChange}
          rows={5}
          className="rounded-xl border px-4 py-3"
        />

<div className="grid gap-2">
  <label className="font-medium">Upload Photos</label>

  <input
    type="file"
    multiple={true}
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) => {
      setImages(e.target.files);
      console.log("Selected files:", e.target.files?.length);
    }}
    className="rounded-xl border px-4 py-3"
  />

  <p className="text-sm text-gray-500">
    You can select up to 10 photos. Hold Command on Mac or Ctrl on Windows to select multiple photos.
  </p>

  {images && images.length > 0 && (
    <p className="text-sm font-medium text-green-700">
      {images.length} photo(s) selected
    </p>
  )}
</div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-black py-3 text-white disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Vehicle"}
        </button>
      </form>
    </div>
  );
}