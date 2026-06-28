import { analyzeAuctionVehicle } from "@/lib/auctionIntelligence";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";
import AuctionImageUpload from "./AuctionImageUpload";
import AuctionGalleryManager from "./AuctionGalleryManager";
import Car from "@/models/Car";

function num(value: FormDataEntryValue | null) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default async function AuctionVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();

  const car: any = await AuctionVehicle.findById(id).lean();

  if (!car) return notFound();

  async function updateAuctionVehicle(formData: FormData) {
    "use server";

    await connectDB();

    await AuctionVehicle.findByIdAndUpdate(id, {
      vin: String(formData.get("vin") || "").trim().toUpperCase(),
      year: num(formData.get("year")),
      make: String(formData.get("make") || "").trim(),
      model: String(formData.get("model") || "").trim(),
      trim: String(formData.get("trim") || "").trim(),

      auctionName: String(formData.get("auctionName") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      lane: String(formData.get("lane") || "").trim(),
      runNumber: String(formData.get("runNumber") || "").trim(),

      mileage: num(formData.get("mileage")),
      mmr: num(formData.get("mmr")),
      currentBid: num(formData.get("currentBid")),
      maxBid: num(formData.get("maxBid")),
      retailPrice: num(formData.get("retailPrice")),

      auctionFee: num(formData.get("auctionFee")),
      transportCost: num(formData.get("transportCost")),
      repairCost: num(formData.get("repairCost")),
      detailCost: num(formData.get("detailCost")),
      registrationCost: num(formData.get("registrationCost")),

      condition: String(formData.get("condition") || "").trim(),
      damage: String(formData.get("damage") || "").trim(),
      announcements: String(formData.get("announcements") || "").trim(),
      status: String(formData.get("status") || "watching"),
    });

    redirect("/admin/auction-center");
  }

  async function deleteAuctionVehicle() {
    "use server";

    await connectDB();
    await AuctionVehicle.findByIdAndDelete(id);

    redirect("/admin/auction-center");
  }

  async function moveToInventory() {
    "use server";

    await connectDB();

    const auctionCar: any = await AuctionVehicle.findById(id).lean();

    if (!auctionCar) return notFound();

    if (auctionCar.movedToInventory && auctionCar.inventoryCarId) {
      redirect(`/admin/edit-car/${auctionCar.inventoryCarId}`);
    }

    const existingCar: any = auctionCar.vin
      ? await Car.findOne({ vin: auctionCar.vin }).lean()
      : null;

    if (existingCar) {
      await AuctionVehicle.findByIdAndUpdate(id, {
        status: "purchased",
        movedToInventory: true,
        inventoryCarId: existingCar._id,
      });

      redirect(`/admin/edit-car/${existingCar._id}`);
    }

    const title =
      auctionCar.title ||
      `${auctionCar.year} ${auctionCar.make} ${auctionCar.model} ${
        auctionCar.trim || ""
      }`.trim();

    const images = Array.isArray(auctionCar.images)
      ? auctionCar.images
          .map((img: any, index: number) => {
            const url = typeof img === "string" ? img : img?.url;
            if (!url) return null;

            return {
              url,
              publicId:
                typeof img === "object"
                  ? img.publicId || img.public_id || ""
                  : "",
              isCover: index === 0,
            };
          })
          .filter(Boolean)
      : [];

    const newCar = await Car.create({
      title,
      year: Number(auctionCar.year || 0),
      make: auctionCar.make || "",
      model: auctionCar.model || "",
      trim: auctionCar.trim || "",
      vin: auctionCar.vin || "",
      mileage: Number(auctionCar.mileage || 0),
      price: Number(auctionCar.retailPrice || 0),
      cost: Number(auctionCar.currentBid || 0),
      status: "available",
      isActive: true,
      images,
      description: `
Imported from Auction Center

Auction: ${auctionCar.auctionName || ""}
Location: ${auctionCar.location || ""}
Lane: ${auctionCar.lane || ""}
Run Number: ${auctionCar.runNumber || ""}

Condition:
${auctionCar.condition || ""}

Damage:
${auctionCar.damage || ""}

Announcements:
${auctionCar.announcements || ""}
      `.trim(),
    });

    await AuctionVehicle.findByIdAndUpdate(id, {
      status: "purchased",
      movedToInventory: true,
      inventoryCarId: newCar._id,
    });

    redirect(`/admin/edit-car/${newCar._id}`);
  }

  const totalCost =
    Number(car.currentBid || 0) +
    Number(car.auctionFee || 0) +
    Number(car.transportCost || 0) +
    Number(car.repairCost || 0) +
    Number(car.detailCost || 0) +
    Number(car.registrationCost || 0);

  const profit = Number(car.retailPrice || 0) - totalCost;
  const ai = analyzeAuctionVehicle(car);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black">
              {car.year} {car.make} {car.model}
            </h1>
            <p className="mt-2 text-gray-500">VIN: {car.vin || "N/A"}</p>
          </div>

          <Link
            href="/admin/auction-center"
            className="rounded-xl border px-5 py-3 font-bold"
          >
            Back
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Cost</p>
            <h2 className="text-3xl font-black">{money(totalCost)}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Retail Price</p>
            <h2 className="text-3xl font-black">{money(car.retailPrice)}</h2>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Profit</p>
            <h2
              className={
                profit >= 0
                  ? "text-3xl font-black text-green-600"
                  : "text-3xl font-black text-red-600"
              }
            >
              {money(profit)}
            </h2>
          </div>
        </div>

        <AuctionImageUpload vehicleId={car._id.toString()} />

        <AuctionGalleryManager
          vehicleId={car._id.toString()}
          images={car.images || []}
        />

        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">
                Auction Intelligence
              </p>
              <h2
                className={
                  ai.decision === "BUY"
                    ? "text-5xl font-black text-green-600"
                    : ai.decision === "PASS"
                    ? "text-5xl font-black text-red-600"
                    : "text-5xl font-black text-yellow-600"
                }
              >
                {ai.decision}
              </h2>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Score</p>
              <h3 className="text-4xl font-black">{ai.score}/100</h3>
              <p className="text-sm text-gray-500">Margin: {ai.margin}%</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-black text-green-700">Reasons</h3>
              {ai.reasons.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No strong positive signals yet.
                </p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {ai.reasons.map((r: string) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-black text-red-700">Warnings</h3>
              {ai.warnings.length === 0 ? (
                <p className="text-sm text-gray-500">No major warnings.</p>
              ) : (
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {ai.warnings.map((w: string) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <form
          action={updateAuctionVehicle}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <input name="vin" defaultValue={car.vin || ""} placeholder="VIN" className="rounded-xl border p-3 md:col-span-2" />
            <input name="year" defaultValue={car.year || ""} placeholder="Year" type="number" className="rounded-xl border p-3" />
            <input name="mileage" defaultValue={car.mileage || ""} placeholder="Mileage" type="number" className="rounded-xl border p-3" />

            <input name="make" defaultValue={car.make || ""} placeholder="Make" className="rounded-xl border p-3" />
            <input name="model" defaultValue={car.model || ""} placeholder="Model" className="rounded-xl border p-3" />
            <input name="trim" defaultValue={car.trim || ""} placeholder="Trim" className="rounded-xl border p-3" />

            <select name="status" defaultValue={car.status || "watching"} className="rounded-xl border p-3">
              <option value="watching">Watching</option>
              <option value="bidding">Bidding</option>
              <option value="purchased">Purchased</option>
              <option value="passed">Passed</option>
              <option value="sold">Sold</option>
            </select>

            <input name="auctionName" defaultValue={car.auctionName || ""} placeholder="Auction" className="rounded-xl border p-3" />
            <input name="location" defaultValue={car.location || ""} placeholder="Location" className="rounded-xl border p-3" />
            <input name="lane" defaultValue={car.lane || ""} placeholder="Lane" className="rounded-xl border p-3" />
            <input name="runNumber" defaultValue={car.runNumber || ""} placeholder="Run #" className="rounded-xl border p-3" />

            <input name="mmr" defaultValue={car.mmr || ""} placeholder="MMR" type="number" className="rounded-xl border p-3" />
            <input name="currentBid" defaultValue={car.currentBid || ""} placeholder="Current Bid" type="number" className="rounded-xl border p-3" />
            <input name="maxBid" defaultValue={car.maxBid || ""} placeholder="Max Bid" type="number" className="rounded-xl border p-3" />
            <input name="retailPrice" defaultValue={car.retailPrice || ""} placeholder="Retail Price" type="number" className="rounded-xl border p-3" />

            <input name="auctionFee" defaultValue={car.auctionFee || ""} placeholder="Auction Fee" type="number" className="rounded-xl border p-3" />
            <input name="transportCost" defaultValue={car.transportCost || ""} placeholder="Transport" type="number" className="rounded-xl border p-3" />
            <input name="repairCost" defaultValue={car.repairCost || ""} placeholder="Repair" type="number" className="rounded-xl border p-3" />
            <input name="detailCost" defaultValue={car.detailCost || ""} placeholder="Detail" type="number" className="rounded-xl border p-3" />
            <input name="registrationCost" defaultValue={car.registrationCost || ""} placeholder="Registration" type="number" className="rounded-xl border p-3" />
          </div>

          <div className="mt-6 grid gap-4">
            <textarea name="condition" defaultValue={car.condition || ""} placeholder="Condition" className="min-h-24 rounded-xl border p-3" />
            <textarea name="damage" defaultValue={car.damage || ""} placeholder="Damage" className="min-h-24 rounded-xl border p-3" />
            <textarea name="announcements" defaultValue={car.announcements || ""} placeholder="Announcements" className="min-h-24 rounded-xl border p-3" />
          </div>

          <button className="mt-8 w-full rounded-xl bg-red-600 p-4 text-lg font-black text-white hover:bg-red-700">
            Save Changes
          </button>
        </form>

        {car.movedToInventory && car.inventoryCarId ? (
          <Link
            href={`/admin/edit-car/${car.inventoryCarId.toString()}`}
            className="mt-4 block w-full rounded-xl bg-gray-900 p-4 text-center font-black text-white hover:bg-black"
          >
            Already Moved — Open Inventory Vehicle
          </Link>
        ) : (
          <form action={moveToInventory} className="mt-4">
            <button className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700">
              Move To Inventory
            </button>
          </form>
        )}

        <form action={deleteAuctionVehicle} className="mt-4">
          <button className="w-full rounded-xl border border-red-300 bg-white p-4 font-black text-red-600 hover:bg-red-50">
            Delete Vehicle
          </button>
        </form>
      </div>
    </main>
  );
}
