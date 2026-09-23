"use client";

import { useState } from "react";
import PhotoManager from "@/components/PhotoManager";
import VehicleVideoField from "@/components/admin/VehicleVideoField";
import VehicleHistoryReportSection, {
  VehicleHistoryReportInput,
} from "@/components/admin/VehicleHistoryReportSection";
import VinDecodeButton, { DecodedVinData } from "@/components/admin/VinDecodeButton";
import VinDecodedInfoPanel from "@/components/VinDecodedInfoPanel";
import { resolveVinFieldUpdates } from "@/lib/vinFieldMerge";

const EMPTY_HISTORY_REPORT: VehicleHistoryReportInput = {
  url: "",
  source: "carfax",
  reportDate: null,
};

export default function AddCar() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [status, setStatus] = useState("available");
  const [isFeatured, setIsFeatured] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [vin, setVin] = useState("");
  const [decodedInfo, setDecodedInfo] = useState<DecodedVinData | null>(null);
  const [historyReport, setHistoryReport] = useState<VehicleHistoryReportInput>(
    EMPTY_HISTORY_REPORT
  );

  function handleDecoded(data: DecodedVinData) {
    setDecodedInfo(data);

    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;

    const field = (name: string) =>
      form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;

    const yearInput = field("year");
    const makeInput = field("make");
    const modelInput = field("model");
    const trimInput = field("trim");
    const bodyClassInput = field("bodyClass");
    const engineInput = field("engine");
    const transmissionInput = field("transmission");
    const drivetrainInput = field("drivetrain");
    const fuelTypeInput = field("fuelType");
    const titleInput = field("title");
    const descriptionInput = field("description") as HTMLTextAreaElement | null;

    const derivedTitle = `${data.year || ""} ${data.make || ""} ${data.model || ""}`
      .replace(/\s+/g, " ")
      .trim();

    const derivedDescription = `${derivedTitle}

Engine: ${data.engine || "N/A"}
Fuel: ${data.fuel || "N/A"}
Body Style: ${data.body || "N/A"}

This vehicle is available now at Drive Prime Motors.
Contact us today to schedule a test drive or financing options.`.trim();

    const updates = resolveVinFieldUpdates([
      { key: "year", label: "Year", current: yearInput?.value || "", decoded: data.year || "" },
      { key: "make", label: "Make", current: makeInput?.value || "", decoded: data.make || "" },
      { key: "model", label: "Model", current: modelInput?.value || "", decoded: data.model || "" },
      { key: "trim", label: "Trim", current: trimInput?.value || "", decoded: data.trim || "" },
      { key: "bodyClass", label: "Body Class", current: bodyClassInput?.value || "", decoded: data.body || "" },
      { key: "engine", label: "Engine", current: engineInput?.value || "", decoded: data.engine || "" },
      { key: "transmission", label: "Transmission", current: transmissionInput?.value || "", decoded: data.transmission || "" },
      { key: "drivetrain", label: "Drive Type", current: drivetrainInput?.value || "", decoded: data.driveType || "" },
      { key: "fuelType", label: "Fuel Type", current: fuelTypeInput?.value || "", decoded: data.fuel || "" },
      { key: "title", label: "Title", current: titleInput?.value || "", decoded: derivedTitle },
      { key: "description", label: "Description", current: descriptionInput?.value || "", decoded: derivedDescription },
    ]);

    if (updates.year && yearInput) yearInput.value = updates.year;
    if (updates.make && makeInput) makeInput.value = updates.make;
    if (updates.model && modelInput) modelInput.value = updates.model;
    if (updates.trim && trimInput) trimInput.value = updates.trim;
    if (updates.bodyClass && bodyClassInput) bodyClassInput.value = updates.bodyClass;
    if (updates.engine && engineInput) engineInput.value = updates.engine;
    if (updates.transmission && transmissionInput) transmissionInput.value = updates.transmission;
    if (updates.drivetrain && drivetrainInput) drivetrainInput.value = updates.drivetrain;
    if (updates.fuelType && fuelTypeInput) fuelTypeInput.value = updates.fuelType;
    if (updates.title && titleInput) titleInput.value = updates.title;
    if (updates.description && descriptionInput) descriptionInput.value = updates.description;
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
      trim: String(formData.get("trim") || ""),
      bodyClass: String(formData.get("bodyClass") || ""),
      engine: String(formData.get("engine") || ""),
      transmission: String(formData.get("transmission") || ""),
      drivetrain: String(formData.get("drivetrain") || ""),
      fuelType: String(formData.get("fuelType") || ""),
      mileage: Number(formData.get("mileage") || 0),
      titleStatus: String(formData.get("titleStatus") || "unknown"),
      description: String(formData.get("description") || ""),
      videoUrl,
      vehicleHistoryReport: historyReport,
      images,
      status,
      isFeatured,
    };

    try {
      const res = await fetch("/api/admin/cars", {
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
        setVideoUrl("");
        setVin("");
        setDecodedInfo(null);
        setHistoryReport(EMPTY_HISTORY_REPORT);
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
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-black text-gray-900">Add Vehicle</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="vin"
            placeholder="VIN"
            maxLength={17}
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            className="border p-2 w-full"
          />

          <VinDecodeButton vin={vin} onDecoded={handleDecoded} />
        </div>

        {decodedInfo && (
          <VinDecodedInfoPanel
            fields={{
              year: decodedInfo.year,
              make: decodedInfo.make,
              model: decodedInfo.model,
              trim: decodedInfo.trim,
              body: decodedInfo.body,
              engine: decodedInfo.engine,
              transmission: decodedInfo.transmission,
              fuel: decodedInfo.fuel,
              driveType: decodedInfo.driveType,
              manufacturer: decodedInfo.manufacturer,
              plantCountry: decodedInfo.plantCountry,
              plantState: decodedInfo.plantState,
              plantCity: decodedInfo.plantCity,
              source: decodedInfo.source,
              decodedAt: decodedInfo.decodedAt,
              cached: decodedInfo.cached,
            }}
          />
        )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="year"
            type="number"
            placeholder="Year"
            className="border p-2 w-full"
          />

          <input
            name="trim"
            placeholder="Trim"
            className="border p-2 w-full"
          />
        </div>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="bodyClass"
            placeholder="Body Class"
            className="border p-2 w-full"
          />
          <input
            name="engine"
            placeholder="Engine"
            className="border p-2 w-full"
          />
          <input
            name="transmission"
            placeholder="Transmission"
            className="border p-2 w-full"
          />
          <input
            name="drivetrain"
            placeholder="Drive Type"
            className="border p-2 w-full"
          />
          <input
            name="fuelType"
            placeholder="Fuel Type"
            className="border p-2 w-full"
          />
        </div>

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
        <VehicleVideoField value={videoUrl} onChange={setVideoUrl} />

        <VehicleHistoryReportSection value={historyReport} onChange={setHistoryReport} />

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
