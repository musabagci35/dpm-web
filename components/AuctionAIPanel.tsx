type Props = {
    latestCars: any[];
  };
  
  function safeNumber(value: any) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  
  function formatMoney(value: number) {
    return `$${value.toLocaleString()}`;
  }
  
  function estimateRetail(car: any) {
    const year = safeNumber(car.year);
    const price = safeNumber(car.price);
    const make = String(car.make || "").toLowerCase();
    const model = String(car.model || "").toLowerCase();
    const mileage = safeNumber(car.mileage);
  
    let retail = price || 0;
  
    if (!retail) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
  
      retail = 12000;
  
      if (age > 12) retail = 5000;
      else if (age > 8) retail = 8500;
      else if (age > 5) retail = 12000;
      else retail = 18000;
  
      if (make === "toyota" || make === "honda") retail += 1200;
      if (model.includes("prius")) retail += 800;
      if (mileage > 120000) retail -= 1200;
      if (mileage > 180000) retail -= 1800;
    } else {
      retail = Math.round(retail * 1.18);
    }
  
    return Math.max(retail, 2500);
  }
  
  function estimateAuctionBuy(car: any) {
    const listedPrice = safeNumber(car.price);
  
    if (listedPrice > 0) {
      return Math.round(listedPrice * 0.78);
    }
  
    const retail = estimateRetail(car);
    return Math.round(retail * 0.7);
  }
  
  function estimateRecon(car: any) {
    const mileage = safeNumber(car.mileage);
    let recon = 1200;
  
    if (mileage > 100000) recon += 600;
    if (mileage > 150000) recon += 900;
  
    return recon;
  }
  
  function scoreCar(car: any) {
    const retail = estimateRetail(car);
    const buy = estimateAuctionBuy(car);
    const recon = estimateRecon(car);
    const profit = retail - buy - recon;
  
    let speed = "Medium";
  
    const make = String(car.make || "").toLowerCase();
    const model = String(car.model || "").toLowerCase();
  
    if (
      make === "toyota" ||
      make === "honda" ||
      model.includes("prius") ||
      model.includes("civic") ||
      model.includes("corolla")
    ) {
      speed = "Fast";
    }
  
    return {
      ...car,
      retail,
      buy,
      recon,
      profit,
      speed,
    };
  }
  
  export default function AuctionAIPanel({ latestCars }: Props) {
    const analyzed = latestCars.map(scoreCar).sort((a, b) => b.profit - a.profit);
  
    const bestDeal = analyzed[0];
    const missingPrices = latestCars.filter((car) => !safeNumber(car.price));
    const fastCars = analyzed.filter((car) => car.speed === "Fast").slice(0, 3);
  
    return (
      <section className="bg-white border rounded-xl p-6 mb-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">Auction AI</h2>
            <p className="text-sm text-gray-500 mt-1">
              Finds profit opportunities and fast-selling vehicle signals
            </p>
          </div>
  
          <div className="text-sm rounded-full bg-red-600 text-white px-4 py-2">
            Auction Mode
          </div>
        </div>
  
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Best Profit Candidate</p>
            <p className="text-lg font-semibold mt-2">
              {bestDeal
                ? `${bestDeal.year || ""} ${bestDeal.make || ""} ${bestDeal.model || ""}`.trim()
                : "No data"}
            </p>
            <p className="text-2xl font-bold mt-2 text-green-600">
              {bestDeal ? formatMoney(bestDeal.profit) : "$0"}
            </p>
          </div>
  
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Estimated Auction Buy</p>
            <p className="text-lg font-semibold mt-2">
              {bestDeal ? formatMoney(bestDeal.buy) : "$0"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Suggested max buy target
            </p>
          </div>
  
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Missing Prices</p>
            <p className="text-2xl font-bold mt-2">
              {missingPrices.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Vehicles needing price review
            </p>
          </div>
        </div>
  
        <div className="mt-6 rounded-xl bg-gray-50 border p-5">
          <h3 className="font-semibold mb-3">AI Auction Notes</h3>
  
          <div className="space-y-2 text-sm text-gray-700">
            {bestDeal ? (
              <>
                <div>• Best current profit candidate: {bestDeal.year} {bestDeal.make} {bestDeal.model}</div>
                <div>• Estimated retail target: {formatMoney(bestDeal.retail)}</div>
                <div>• Estimated buy target: {formatMoney(bestDeal.buy)}</div>
                <div>• Estimated recon budget: {formatMoney(bestDeal.recon)}</div>
                <div>• Estimated gross profit: {formatMoney(bestDeal.profit)}</div>
              </>
            ) : (
              <div>• No inventory available for auction analysis.</div>
            )}
          </div>
        </div>
  
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Fast Movers</h3>
  
          <div className="grid md:grid-cols-3 gap-4">
            {fastCars.length === 0 ? (
              <div className="text-sm text-gray-500">No fast-mover data yet.</div>
            ) : (
              fastCars.map((car: any) => (
                <div key={String(car._id)} className="border rounded-xl p-4">
                  <p className="font-semibold">
                    {car.year} {car.make} {car.model}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Speed: {car.speed}
                  </p>
                  <p className="text-sm text-gray-500">
                    Profit: {formatMoney(car.profit)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }