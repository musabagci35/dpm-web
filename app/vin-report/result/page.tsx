import Link from "next/link";

type Props = {
  searchParams: Promise<{
    vin?: string;
  }>;
};

export default async function VinReportResultPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const vin = String(params.vin || "").trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold">Invalid VIN</h1>
          <p className="mt-3 text-gray-600">
            Please enter a valid 17-character VIN.
          </p>

          <Link
            href="/vin-report"
            className="mt-6 inline-block rounded-xl bg-black px-5 py-3 text-white"
          >
            Try Again
          </Link>
        </div>
      </main>
    );
  }

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`,
    { cache: "no-store" }
  );

  const data = await res.json();
  const vehicle = data.Results?.[0] || {};

  const make = vehicle.Make || "N/A";
  const model = vehicle.Model || "N/A";
  const year = vehicle.ModelYear || "N/A";
  const trim = vehicle.Trim || "N/A";
  const body = vehicle.BodyClass || "N/A";
  const fuel = vehicle.FuelTypePrimary || "N/A";
  const engine = vehicle.EngineModel || "N/A";
  const manufacturer =
    vehicle.Manufacturer || vehicle.ManufacturerName || "N/A";
  const doors = vehicle.Doors || "N/A";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/vin-report" className="text-sm text-blue-600">
            ← Back to VIN Search
          </Link>

          <h1 className="mt-4 text-4xl font-bold">VIN Report</h1>
          <p className="mt-2 text-gray-600">{vin}</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">
            {year} {make} {model}
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Year" value={year} />
            <Info label="Make" value={make} />
            <Info label="Model" value={model} />
            <Info label="Trim" value={trim} />
            <Info label="Body Style" value={body} />
            <Info label="Fuel" value={fuel} />
            <Info label="Engine" value={engine} />
            <Info label="Manufacturer" value={manufacturer} />
            <Info label="Doors" value={doors} />
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}