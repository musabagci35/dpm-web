import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import AuctionVehicle from "@/models/AuctionVehicle";

function money(n: number) {
  return `$${Number(n || 0).toLocaleString()}`;
}

export default async function AuctionCenterAdminPage() {
  await dbConnect();

  const vehicles = await AuctionVehicle.find({})
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Auction Center</h1>
          <p className="text-gray-500">Watch, calculate, and manage auction vehicles.</p>
        </div>

        <Link
          href="/admin/auction-center/add"
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          Add Auction Vehicle
        </Link>
      </div>

      <div className="grid gap-4">
        {vehicles.map((car: any) => {
          const totalCost =
            car.currentBid +
            car.auctionFee +
            car.transportCost +
            car.repairCost +
            car.detailCost +
            car.registrationCost;

          const profit = car.retailPrice - totalCost;

          return (
            <div
              key={car._id.toString()}
              className="border rounded-xl p-4 bg-white shadow-sm flex justify-between gap-4"
            >
              <div>
                <h2 className="text-xl font-semibold">
                  {car.year} {car.make} {car.model} {car.trim}
                </h2>

                <p className="text-sm text-gray-500">
                  {car.auctionName} / {car.location}
                </p>

                <p className="text-sm mt-1">
                  VIN: {car.vin || "N/A"} | Mileage:{" "}
                  {Number(car.mileage || 0).toLocaleString()}
                </p>

                <p className="text-sm">
                  Lane: {car.lane || "-"} | Run #: {car.runNumber || "-"}
                </p>
              </div>

              <div className="text-right">
                <p>MMR: {money(car.mmr)}</p>
                <p>Bid: {money(car.currentBid)}</p>
                <p>Total Cost: {money(totalCost)}</p>

                <p
                  className={`font-bold ${
                    profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Profit: {money(profit)}
                </p>

                <Link
                  href={`/admin/auction-center/${car._id}`}
                  className="inline-block mt-2 text-blue-600 underline"
                >
                  View / Edit
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}