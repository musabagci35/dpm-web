"use client";

import React, { useState } from "react";

type VinData = {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  fuel?: string;
  body?: string;
};

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
  const [vinLoading, setVinLoading] = useState(false);
  const [vinData, setVinData] = useState<VinData | null>(null);
  const [showVinPopup, setShowVinPopup] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const next = { ...form, [e.target.name]: e.target.value.toUpperCase() };
    if (e.target.name !== "vin") next[e.target.name as keyof typeof form] = e.target.value;
    setForm(next);
  };

  async function decodeVin() {
    const vin = form.vin.trim().toUpperCase();

    if (!vin || vin.length !== 17) {
      alert("Please enter a valid 17-character VIN.");
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
        alert(data.error || "VIN decode failed.");
        return;
      }

      const decoded: VinData = {
        year: data.year || "",
        make: data.make || "",
        model: data.model || "",
        trim: data.trim || "",
        engine: data.engine || "",
        fuel: data.fuel || "",
        body: data.body || "",
      };

      setVinData(decoded);
      setShowVinPopup(true);
    } catch (error) {
      console.error(error);
      alert("VIN decode failed. Please try again.");
    } finally {
      setVinLoading(false);
    }
  }

  function confirmVinData() {
    if (!vinData) return;

    setForm({
      ...form,
      year: vinData.year || form.year,
      make: vinData.make || form.make,
      model: vinData.model || form.model,
      message:
        form.message ||
        `VIN decoded vehicle information:
Year: ${vinData.year || "N/A"}
Make: ${vinData.make || "N/A"}
Model: ${vinData.model || "N/A"}
Trim: ${vinData.trim || "N/A"}
Engine: ${vinData.engine || "N/A"}
Fuel: ${vinData.fuel || "N/A"}
Body: ${vinData.body || "N/A"}`,
    });

    setShowVinPopup(false);
  }

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
          vinDecoded: vinData,
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
      setVinData(null);
    } catch (error) {
      alert("Error submitting vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {showVinPopup && vinData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">
              VIN Decoded
            </p>

            <h2 className="mt-2 text-3xl font-black text-gray-900">
              Is this your vehicle?
            </h2>

            <div className="mt-5 rounded-2xl border bg-gray-50 p-5">
              <h3 className="text-2xl font-black">
                {vinData.year} {vinData.make} {vinData.model}
              </h3>

              <div className="mt-4 grid gap-3 text-sm">
                <Info label="Trim" value={vinData.trim || "N/A"} />
                <Info label="Engine" value={vinData.engine || "N/A"} />
                <Info label="Fuel" value={vinData.fuel || "N/A"} />
                <Info label="Body" value={vinData.body || "N/A"} />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={confirmVinData}
                className="rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-700"
              >
                Yes, This Is My Car
              </button>

              <button
                type="button"
                onClick={() => setShowVinPopup(false)}
                className="rounded-2xl border px-5 py-4 font-black hover:bg-gray-50"
              >
                I’ll Enter Manually
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">
            Sell or Trade Your Car
          </p>

          <h1 className="mt-3 max-w-3xl text-5xl font-black tracking-tight">
            Get a Fast Offer for Your Vehicle
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-white/70">
            Enter your VIN, upload photos, and tell us about your vehicle.
            Drive Prime Motors will review and contact you with the next step.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1fr_420px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border bg-white p-6 shadow-sm md:p-8"
        >
          <h2 className="text-3xl font-black">Vehicle Information</h2>

          <div className="mt-6 grid gap-4">
            <input
              name="name"
              value={form.name}
              placeholder="Your Name"
              onChange={handleChange}
              required
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <input
              name="phone"
              value={form.phone}
              placeholder="Phone Number"
              onChange={handleChange}
              required
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <input
              name="email"
              value={form.email}
              type="email"
              placeholder="Email Address"
              onChange={handleChange}
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                name="vin"
                value={form.vin}
                placeholder="VIN Number"
                onChange={handleChange}
                maxLength={17}
                className="rounded-2xl border px-4 py-4 uppercase outline-none focus:border-red-600"
              />

              <button
                type="button"
                onClick={decodeVin}
                disabled={vinLoading}
                className="rounded-2xl bg-black px-5 py-4 font-black text-white hover:bg-red-700 disabled:opacity-60"
              >
                {vinLoading ? "Checking..." : "Decode VIN"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                name="year"
                value={form.year}
                placeholder="Year"
                onChange={handleChange}
                className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
              />

              <input
                name="make"
                value={form.make}
                placeholder="Make"
                onChange={handleChange}
                className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
              />

              <input
                name="model"
                value={form.model}
                placeholder="Model"
                onChange={handleChange}
                className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
              />
            </div>

            <input
              name="mileage"
              value={form.mileage}
              placeholder="Mileage"
              onChange={handleChange}
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <input
              name="price"
              value={form.price}
              placeholder="Your Asking Price"
              onChange={handleChange}
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <textarea
              name="message"
              value={form.message}
              placeholder="Tell us about condition, title status, problems, upgrades, or payoff balance..."
              onChange={handleChange}
              rows={6}
              className="rounded-2xl border px-4 py-4 outline-none focus:border-red-600"
            />

            <div className="rounded-2xl border bg-gray-50 p-5">
              <label className="font-black">Upload Photos</label>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImages(e.target.files)}
                className="mt-3 w-full rounded-2xl border bg-white px-4 py-4"
              />

              <p className="mt-2 text-sm text-gray-500">
                Upload front, rear, sides, interior, odometer, and title if available.
              </p>

              {images && images.length > 0 && (
                <p className="mt-2 text-sm font-bold text-green-700">
                  {images.length} photo(s) selected
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Vehicle"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <div className="rounded-3xl bg-black p-6 text-white shadow-sm">
            <h3 className="text-2xl font-black">Why Sell to Us?</h3>
            <div className="mt-5 space-y-4 text-sm text-white/80">
              <p>✓ Fast local review</p>
              <p>✓ Trade-in support</p>
              <p>✓ No pressure offer</p>
              <p>✓ Sacramento / Rancho Cordova area</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black">Need Help?</h3>
            <p className="mt-2 text-gray-600">
              Call us if you do not have the VIN or need help submitting photos.
            </p>

            <a
              href="tel:+19162618880"
              className="mt-5 block rounded-2xl bg-red-600 px-5 py-4 text-center font-black text-white hover:bg-red-700"
            >
              Call (916) 261-8880
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-xl bg-white px-4 py-3">
      <span className="font-bold text-gray-500">{label}</span>
      <span className="font-black text-gray-900">{value}</span>
    </div>
  );
}
