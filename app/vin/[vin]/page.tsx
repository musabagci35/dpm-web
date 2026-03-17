import Image from "next/image";
import AuctionIntelligencePanel from "@/components/AuctionIntelligencePanel";
import VehicleHistoryPanel from "@/components/VehicleHistoryPanel";

type Props = {
  params: Promise<{ vin: string }>;
};

function numberOrZero(value: any) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function estimateMarketValue(year: number, make: string, model: string) {
  const age = new Date().getFullYear() - year;

  let base = 14000;

  if (age > 12) base = 4500;
  else if (age > 8) base = 8500;
  else if (age > 4) base = 13500;

  if (make.toLowerCase() === "toyota" || make.toLowerCase() === "honda") {
    base += 1500;
  }

  if (model.toLowerCase().includes("prius")) {
    base += 1000;
  }

  return Math.max(base, 2500);
}

export default async function VinPage({ params }: Props) {
  const { vin } = await params;
  const cleanVin = vin.trim().toUpperCase();

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(
      cleanVin
    )}?format=json`,
    { cache: "no-store" }
  );

  const data = await res.json();
  const vehicle = data?.Results?.[0];

  const make = vehicle?.Make || "Unknown";
  const model = vehicle?.Model || "Unknown";
  const year = numberOrZero(vehicle?.ModelYear);
  const trim = vehicle?.Trim || "";
  const fuel = vehicle?.FuelTypePrimary || "—";
  const body = vehicle?.BodyClass || "—";
  const manufacturer = vehicle?.Manufacturer || "—";
  const doors = vehicle?.Doors || "—";
  const driveType = vehicle?.DriveType || "—";
  const transmission = vehicle?.TransmissionStyle || "—";

  const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(
    make
  )}&modelFamily=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(
    String(year || "2020")
  )}&zoomType=fullscreen&angle=front`;

  const marketValue = estimateMarketValue(year || 2016, make, model);
  const suggestedPrice = Math.round(marketValue * 0.95);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6">
            <Image
              src={imageUrl}
              alt={`${year} ${make} ${model}`}
              width={1200}
              height={800}
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-2xl font-bold">Vehicle Specs</div>

              <div className="mt-4 space-y-2 text-sm">
                <div><strong>Make:</strong> {make}</div>
                <div><strong>Model:</strong> {model}</div>
                <div><strong>Year:</strong> {year || "—"}</div>
                <div><strong>Trim:</strong> {trim || "—"}</div>
                <div><strong>Fuel:</strong> {fuel}</div>
                <div><strong>Body:</strong> {body}</div>
                <div><strong>Drive Type:</strong> {driveType}</div>
                <div><strong>Transmission:</strong> {transmission}</div>
                <div><strong>Doors:</strong> {doors}</div>
                <div><strong>Manufacturer:</strong> {manufacturer}</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-2xl font-bold">Market Intelligence</div>

              <div className="mt-4 text-4xl font-bold text-green-600">
                ${marketValue.toLocaleString()}
              </div>
              <div className="mt-1 text-gray-600">
                Estimated Market Value
              </div>

              <div className="mt-5 text-3xl font-semibold">
                ${suggestedPrice.toLocaleString()}
              </div>
              <div className="mt-1 text-gray-600">
                Suggested Dealer List Price
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AuctionIntelligencePanel vin={cleanVin} />
        </div>

        <div className="mt-6">
          <VehicleHistoryPanel vin={cleanVin} />
        </div>
      </div>
    </div>
  );
}