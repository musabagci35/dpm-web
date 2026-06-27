import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import AuctionVehicle from "@/models/AuctionVehicle";
import { analyzeAuctionVehicle } from "@/lib/auctionIntelligence";

function money(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function firstImage(car: any) {
  const img = Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : null;
  return typeof img === "string" ? img : img?.url || "";
}

export default async function AuctionCenterPage() {
  await connectDB();

  const vehicles: any[] = await AuctionVehicle.find({})
    .sort({ createdAt: -1 })
    .lean();

  const totalVehicles = vehicles.length;
  const watching = vehicles.filter((v) => v.status === "watching").length;
  const purchased = vehicles.filter((v) => v.status === "purchased").length;
  const moved = vehicles.filter((v) => v.movedToInventory).length;

  const totalExpectedProfit = vehicles.reduce((sum, car) => {
    const ai = analyzeAuctionVehicle(car);
    return sum + Number(ai.profit || 0);
  }, 0);

  const buyCount = vehicles.filter((car) => analyzeAuctionVehicle(car).decision === "BUY").length;
  const passCount = vehicles.filter((car) => analyzeAuctionVehicle(car).decision === "PASS").length;
  const watchCount = vehicles.filter((car) => analyzeAuctionVehicle(car).decision === "WATCH").length;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-red-400">
              Drive Prime Motors
            </p>
            <h1 className="mt-2 text-5xl font-black">Auction Command Center</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Import, analyze, buy, and move vehicles into inventory from one professional dealer cockpit.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/auction-center/import"
              className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white hover:bg-blue-700"
            >
              Import Auction
            </Link>
            <Link
              href="/admin/auction-center/add"
              className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
            >
              + Add Vehicle
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-400">Total Vehicles</p>
            <h2 className="mt-2 text-4xl font-black">{totalVehicles}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-400">Expected Profit</p>
            <h2 className={totalExpectedProfit >= 0 ? "mt-2 text-4xl font-black text-green-400" : "mt-2 text-4xl font-black text-red-400"}>
              {money(totalExpectedProfit)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-400">Moved To Inventory</p>
            <h2 className="mt-2 text-4xl font-black">{moved}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            <p className="text-sm text-slate-400">Watching / Purchased</p>
            <h2 className="mt-2 text-4xl font-black">
              {watching}/{purchased}
            </h2>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
            <p className="text-sm text-green-300">AI BUY</p>
            <h3 className="text-3xl font-black text-green-400">{buyCount}</h3>
          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5">
            <p className="text-sm text-yellow-300">AI WATCH</p>
            <h3 className="text-3xl font-black text-yellow-400">{watchCount}</h3>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm text-red-300">AI PASS</p>
            <h3 className="text-3xl font-black text-red-400">{passCount}</h3>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center text-slate-400">
            No auction vehicles yet.
          </div>
        ) : (
          <div className="grid gap-5">
            {vehicles.map((car) => {
              const ai = analyzeAuctionVehicle(car);
              const img = firstImage(car);

              return (
                <div
                  key={car._id.toString()}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-900 shadow-xl"
                >
                  <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                    <Link
                      href={`/admin/auction-center/${car._id}`}
                      className="block h-56 bg-slate-200 md:h-full"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                          No Photo
                        </div>
                      )}
                    </Link>

                    <div className="p-5">
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <Link
                            href={`/admin/auction-center/${car._id}`}
                            className="text-2xl font-black hover:text-red-600"
                          >
                            {car.year} {car.make} {car.model} {car.trim}
                          </Link>

                          <p className="mt-1 text-sm text-slate-500">
                            VIN: {car.vin || "N/A"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {car.auctionName || "Auction"} • {car.location || "No location"} • Run #{car.runNumber || "-"}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs font-black uppercase text-slate-400">
                            AI Decision
                          </p>
                          <p
                            className={
                              ai.decision === "BUY"
                                ? "text-4xl font-black text-green-600"
                                : ai.decision === "PASS"
                                ? "text-4xl font-black text-red-600"
                                : "text-4xl font-black text-yellow-600"
                            }
                          >
                            {ai.decision}
                          </p>
                          <p className="text-sm font-bold text-slate-500">
                            Score {ai.score}/100
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-5">
                        <div className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-xs text-slate-500">Bid</p>
                          <p className="font-black">{money(car.currentBid)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-xs text-slate-500">Retail</p>
                          <p className="font-black">{money(car.retailPrice)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-xs text-slate-500">Profit</p>
                          <p className={ai.profit >= 0 ? "font-black text-green-600" : "font-black text-red-600"}>
                            {money(ai.profit)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-xs text-slate-500">Margin</p>
                          <p className="font-black">{ai.margin}%</p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3">
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="font-black capitalize">{car.status || "watching"}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={`/admin/auction-center/${car._id}`}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-black"
                        >
                          Open Deal
                        </Link>

                        {car.movedToInventory && car.inventoryCarId && (
                          <Link
                            href={`/admin/edit-car/${car.inventoryCarId.toString()}`}
                            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white hover:bg-green-700"
                          >
                            Open Inventory
                          </Link>
                        )}

                        {car.movedToInventory && (
                          <span className="rounded-xl bg-green-100 px-4 py-2 text-sm font-black text-green-700">
                            Already Moved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
