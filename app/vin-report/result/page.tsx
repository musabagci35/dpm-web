import Link from "next/link";

type Props = {
  searchParams: Promise<{
    vin?: string;
  }>;
};

export default async function VinReportResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const vin = String(params.vin || "").trim().toUpperCase();

  if (!vin || vin.length !== 17) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black">Invalid VIN</h1>
          <p className="mt-3 text-gray-600">
            Please enter a valid 17-character VIN.
          </p>

          <Link
            href="/vin-report"
            className="mt-6 inline-block rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
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
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/vin-report"
            className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white hover:text-black"
          >
            ← Back to VIN Search
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-red-300">
            Basic VIN Decode Report
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight">
            {year} {make} {model}
          </h1>

          <p className="mt-3 text-white/70">
            VIN: {vin}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900">
          <h2 className="text-xl font-black">
            Important Note
          </h2>
          <p className="mt-2 leading-7">
            This free report is a basic VIN decode. It shows decoded vehicle
            information from the VIN. Accident history, salvage records, title
            status, lienholder information, ownership history, odometer rollback,
            and auction records require a paid vehicle history provider.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-black">
              Vehicle Information
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

          <aside className="space-y-5">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black">
                History Status
              </h3>

              <div className="mt-5 space-y-3">
                <StatusRow label="Title Status" value="Not available in free decode" />
                <StatusRow label="Accident History" value="Not available in free decode" />
                <StatusRow label="Salvage / Rebuilt" value="Not available in free decode" />
                <StatusRow label="Lienholder" value="Not available in free decode" />
                <StatusRow label="Auction Records" value="Not available in free decode" />
              </div>
            </div>

            <div className="rounded-3xl bg-black p-6 text-white shadow-sm">
              <h3 className="text-xl font-black">
                Need a Vehicle?
              </h3>
              <p className="mt-2 text-white/70">
                Browse available vehicles or call Drive Prime Motors for help.
              </p>

              <Link
                href="/inventory"
                className="mt-5 block rounded-2xl bg-red-600 px-5 py-4 text-center font-black text-white hover:bg-red-700"
              >
                Browse Inventory
              </Link>

              <a
                href="tel:+19162618880"
                className="mt-3 block rounded-2xl border border-white/20 px-5 py-4 text-center font-black text-white hover:bg-white hover:text-black"
              >
                Call (916) 261-8880
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-1 font-black text-gray-900">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-sm font-black text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{value}</p>
    </div>
  );
}
