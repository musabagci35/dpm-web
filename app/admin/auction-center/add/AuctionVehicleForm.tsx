"use client";

import { useState } from "react";

export default function AuctionVehicleForm({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [vinStatus, setVinStatus] = useState("");

  async function handleVinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const vin = e.target.value.trim().toUpperCase();

    if (vin.length !== 17) return;

    setLoading(true);
    setVinStatus("Decoding VIN...");

    try {
      const res = await fetch(`/api/auction/vin?vin=${vin}`);
      const data = await res.json();

      if (!data.success) {
        setVinStatus(data.error || "VIN decode failed");
        return;
      }

      const v = data.vehicle;

      (document.querySelector('[name="year"]') as HTMLInputElement).value = v.year || "";
      (document.querySelector('[name="make"]') as HTMLInputElement).value = v.make || "";
      (document.querySelector('[name="model"]') as HTMLInputElement).value = v.model || "";
      (document.querySelector('[name="trim"]') as HTMLInputElement).value = v.trim || "";
      (document.querySelector('[name="condition"]') as HTMLTextAreaElement).value =
        `Body: ${v.bodyClass || ""}
Engine: ${v.engine || ""}
Transmission: ${v.transmission || ""}
Drive: ${v.driveType || ""}
Fuel: ${v.fuelType || ""}
Doors: ${v.doors || ""}
Plant: ${v.plantCountry || ""}`;

      setVinStatus(`✓ ${v.year} ${v.make} ${v.model} loaded`);
    } catch {
      setVinStatus("VIN lookup error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={action} className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-black">Vehicle Info</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <input
            name="vin"
            placeholder="VIN"
            onChange={handleVinChange}
            className="w-full rounded-xl border p-3"
          />
          {vinStatus && (
            <p className={loading ? "mt-2 text-sm text-yellow-600" : "mt-2 text-sm text-green-600"}>
              {vinStatus}
            </p>
          )}
        </div>

        <input name="year" placeholder="Year *" type="number" required className="rounded-xl border p-3" />
        <input name="mileage" placeholder="Mileage" type="number" className="rounded-xl border p-3" />

        <input name="make" placeholder="Make *" required className="rounded-xl border p-3" />
        <input name="model" placeholder="Model *" required className="rounded-xl border p-3" />
        <input name="trim" placeholder="Trim" className="rounded-xl border p-3" />

        <select name="status" className="rounded-xl border p-3">
          <option value="watching">Watching</option>
          <option value="bidding">Bidding</option>
          <option value="purchased">Purchased</option>
          <option value="passed">Passed</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      <h2 className="mb-4 mt-8 text-xl font-black">Auction Info</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <select name="auctionName" required className="rounded-xl border p-3">
          <option value="">Auction *</option>
          <option value="Manheim">Manheim</option>
          <option value="Copart">Copart</option>
          <option value="IAA">IAA</option>
          <option value="ACV">ACV</option>
          <option value="Other">Other</option>
        </select>

        <input name="location" placeholder="Location" className="rounded-xl border p-3" />
        <input name="lane" placeholder="Lane" className="rounded-xl border p-3" />
        <input name="runNumber" placeholder="Run #" className="rounded-xl border p-3" />
        <input name="saleDate" type="date" className="rounded-xl border p-3" />
      </div>

      <h2 className="mb-4 mt-8 text-xl font-black">Numbers</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <input name="mmr" placeholder="MMR" type="number" className="rounded-xl border p-3" />
        <input name="currentBid" placeholder="Current Bid" type="number" className="rounded-xl border p-3" />
        <input name="maxBid" placeholder="Max Bid" type="number" className="rounded-xl border p-3" />
        <input name="retailPrice" placeholder="Retail Price" type="number" className="rounded-xl border p-3" />

        <input name="auctionFee" placeholder="Auction Fee" type="number" className="rounded-xl border p-3" />
        <input name="transportCost" placeholder="Transport" type="number" className="rounded-xl border p-3" />
        <input name="repairCost" placeholder="Repair" type="number" className="rounded-xl border p-3" />
        <input name="detailCost" placeholder="Detail" type="number" className="rounded-xl border p-3" />
        <input name="registrationCost" placeholder="Registration" type="number" className="rounded-xl border p-3" />
      </div>

      <h2 className="mb-4 mt-8 text-xl font-black">Notes</h2>

      <div className="grid gap-4">
        <textarea name="condition" placeholder="Condition Report" className="min-h-24 rounded-xl border p-3" />
        <textarea name="damage" placeholder="Damage" className="min-h-24 rounded-xl border p-3" />
        <textarea name="announcements" placeholder="Announcements" className="min-h-24 rounded-xl border p-3" />
      </div>

      <button className="mt-8 w-full rounded-xl bg-red-600 p-4 text-lg font-black text-white hover:bg-red-700">
        Save Auction Vehicle
      </button>
    </form>
  );
}
