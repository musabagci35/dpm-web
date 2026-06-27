import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";

function isVin(value: string) {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(value.trim());
}

function getCopartLot(value: string) {
  const match = value.match(/copart\.com\/lot\/(\d+)/i);
  return match?.[1] || "";
}

async function importAuction(formData: FormData) {
  "use server";

  const raw = String(formData.get("query") || "").trim();
  const vin = raw.toUpperCase();
  const copartLot = getCopartLot(raw);

  await connectDB();

  if (isVin(vin)) {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`,
      { cache: "no-store" }
    );

    const data = await res.json();
    const item = data?.Results?.[0];

    const vehicle = await AuctionVehicle.create({
      title: `${item?.ModelYear || ""} ${item?.Make || ""} ${item?.Model || ""} ${item?.Trim || item?.Series || ""}`.trim(),
      vin,
      year: Number(item?.ModelYear || 0),
      make: item?.Make || "",
      model: item?.Model || "",
      trim: item?.Trim || item?.Series || "",
      auctionName: "Imported",
      condition: `Body: ${item?.BodyClass || ""}
Engine: ${item?.DisplacementL || item?.EngineModel || ""}
Transmission: ${item?.TransmissionStyle || ""}
Drive: ${item?.DriveType || ""}
Fuel: ${item?.FuelTypePrimary || ""}
Plant: ${item?.PlantCountry || ""}`,
      status: "watching",
      isActive: true,
    });

    redirect(`/admin/auction-center/${vehicle._id}`);
  }

  if (copartLot) {
    const vehicle = await AuctionVehicle.create({
      title: `Copart Lot ${copartLot}`,
      vin: "",
      year: 0,
      make: "Copart",
      model: `Lot ${copartLot}`,
      trim: "",
      auctionName: "Copart",
      location: "",
      runNumber: copartLot,
      announcements: raw,
      condition:
        "Imported from Copart URL. Official API access is required to auto-pull photos, bid, damage, and condition report.",
      status: "watching",
      isActive: true,
    });

    redirect(`/admin/auction-center/${vehicle._id}`);
  }

  redirect("/admin/auction-center/import?error=invalid");
}

export default function ImportAuctionPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">Import Auction</h1>
            <p className="mt-2 text-gray-500">
              Paste a VIN or auction lot URL.
            </p>
          </div>

          <Link
            href="/admin/auction-center"
            className="rounded-xl border px-5 py-3 font-bold hover:bg-white"
          >
            Back
          </Link>
        </div>

        <form action={importAuction} className="rounded-2xl bg-white p-6 shadow-sm">
          <label className="mb-2 block font-black">
            VIN or Auction URL
          </label>

          <input
            name="query"
            required
            placeholder="VIN or https://www.copart.com/lot/99284135/..."
            className="w-full rounded-xl border p-4 text-lg"
          />

          <button className="mt-6 w-full rounded-xl bg-blue-600 p-4 text-lg font-black text-white hover:bg-blue-700">
            Import
          </button>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-bold text-gray-900">Examples:</p>
            <p>1HGCM82633A004352</p>
            <p>https://www.copart.com/lot/99284135/...</p>
          </div>
        </form>
      </div>
    </main>
  );
}
