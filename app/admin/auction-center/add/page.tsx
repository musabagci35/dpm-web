import AuctionVehicleForm from "./AuctionVehicleForm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";

function num(value: FormDataEntryValue | null) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

async function createAuctionVehicle(formData: FormData) {
  "use server";

  await connectDB();

  const year = num(formData.get("year"));
  const make = String(formData.get("make") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const trim = String(formData.get("trim") || "").trim();

  await AuctionVehicle.create({
    title: `${year} ${make} ${model} ${trim}`.trim(),
    vin: String(formData.get("vin") || "").trim().toUpperCase(),

    year,
    make,
    model,
    trim,

    auctionName: String(formData.get("auctionName") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    lane: String(formData.get("lane") || "").trim(),
    runNumber: String(formData.get("runNumber") || "").trim(),
    saleDate: formData.get("saleDate") || undefined,

    mileage: num(formData.get("mileage")),
    condition: String(formData.get("condition") || "").trim(),
    damage: String(formData.get("damage") || "").trim(),
    announcements: String(formData.get("announcements") || "").trim(),

    mmr: num(formData.get("mmr")),
    currentBid: num(formData.get("currentBid")),
    maxBid: num(formData.get("maxBid")),
    retailPrice: num(formData.get("retailPrice")),

    auctionFee: num(formData.get("auctionFee")),
    transportCost: num(formData.get("transportCost")),
    repairCost: num(formData.get("repairCost")),
    detailCost: num(formData.get("detailCost")),
    registrationCost: num(formData.get("registrationCost")),

    status: String(formData.get("status") || "watching"),
    isActive: true,
  });

  redirect("/admin/auction-center");
}

export default function AddAuctionVehiclePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Add Auction Vehicle
            </h1>
            <p className="mt-2 text-gray-500">
              Enter VIN and auction details.
            </p>
          </div>

          <Link
            href="/admin/auction-center"
            className="rounded-xl border px-5 py-3 font-bold hover:bg-white"
          >
            Back
          </Link>
        </div>

        <AuctionVehicleForm action={createAuctionVehicle} />
      </div>
    </main>
  );
}
