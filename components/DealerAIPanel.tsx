"use client";

type Props = {
  totalCars?: number;
  liveCars?: number;
  latestCars?: any[];
  vinHistory?: any[];
};

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function DealerDashboard({
  totalCars = 0,
  liveCars = 0,
  latestCars = [],
  vinHistory = [],
}: Props) {

  const prices = latestCars
    .map((car) => Number(car?.price || 0))
    .filter((price) => price > 0);

  const totalInventoryValue = prices.reduce((sum, price) => sum + price, 0);

  const averagePrice =
    prices.length > 0
      ? Math.round(totalInventoryValue / prices.length)
      : 0;

  const potentialProfit =
    averagePrice > 0 ? Math.round(averagePrice * 0.12) : 0;

  const newestCar = latestCars?.[0] || null;
  const newestVinImport = vinHistory?.[0] || null;

  const aiNotes = [
    totalCars === 0
      ? "No vehicles in inventory. Add your first car to activate the dealer system."
      : `You currently have ${totalCars} vehicles in inventory.`,

    liveCars < totalCars
      ? "Some vehicles are not live yet. Review inactive listings."
      : "All vehicles appear live.",

    averagePrice > 0
      ? `Average vehicle price is ${formatMoney(averagePrice)}.`
      : "Some vehicles are missing prices. Add pricing data.",

    newestVinImport
      ? `Most recent VIN import: ${newestVinImport.year || ""} ${
          newestVinImport.make || ""
        } ${newestVinImport.model || ""}`.trim()
      : "No VIN imports recorded.",
  ];

  return (
    <section className="bg-white border rounded-xl p-6 mb-10">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold">Dealer AI Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Smart inventory summary and operational insights
          </p>
        </div>

        <div className="bg-black text-white text-sm px-4 py-2 rounded-full">
          AI Active
        </div>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4 mt-6">

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Inventory Value</p>
          <p className="text-2xl font-bold mt-2">
            {formatMoney(totalInventoryValue)}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Est Dealer Profit</p>
          <p className="text-2xl font-bold mt-2">
            {formatMoney(potentialProfit)}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Average Price</p>
          <p className="text-2xl font-bold mt-2">
            {averagePrice ? formatMoney(averagePrice) : "Missing Data"}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Newest Vehicle</p>
          <p className="text-lg font-semibold mt-2">
            {newestCar
              ? `${newestCar.year || ""} ${newestCar.make || ""} ${
                  newestCar.model || ""
                }`.trim()
              : "No vehicle"}
          </p>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Latest VIN Import</p>
          <p className="text-lg font-semibold mt-2">
            {newestVinImport
              ? `${newestVinImport.year || ""} ${newestVinImport.make || ""} ${
                  newestVinImport.model || ""
                }`.trim()
              : "No import"}
          </p>
        </div>

      </div>

      {/* AI NOTES */}
      <div className="mt-6 bg-gray-50 border rounded-xl p-5">
        <h3 className="font-semibold mb-3">AI Notes</h3>

        <div className="space-y-2 text-sm text-gray-700">
          {aiNotes.map((note, i) => (
            <div key={i} className="flex gap-2">
              <span>•</span>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}