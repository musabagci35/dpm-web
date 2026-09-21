import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { getVinDecodeResult, VinDecodeError, isValidVin } from "@/lib/vinDecode";
import { getRecallsForVehicle } from "@/lib/nhtsaRecalls";
import VinDecodedInfoPanel from "@/components/VinDecodedInfoPanel";

type Props = {
  searchParams: Promise<{
    vin?: string;
  }>;
};

async function getClientIp() {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export default async function VinReportResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const vin = String(params.vin || "").trim().toUpperCase();

  if (!isValidVin(vin)) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16">
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
      </div>
    );
  }

  const ip = await getClientIp();

  let decodeError = "";
  let decoded: Awaited<ReturnType<typeof getVinDecodeResult>> | null = null;

  try {
    decoded = await getVinDecodeResult(vin, { ip, rateLimitMax: 15 });
  } catch (err) {
    decodeError =
      err instanceof VinDecodeError
        ? err.message
        : "VIN decode failed. Please try again.";
  }

  const recallResult =
    decoded?.hasData && decoded.make && decoded.model && decoded.year
      ? await getRecallsForVehicle(decoded.make, decoded.model, decoded.year)
      : null;

  const title = decoded?.hasData
    ? `${decoded.year} ${decoded.make} ${decoded.model}`.trim()
    : "VIN Check";

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/vin-report"
            className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white hover:bg-white hover:text-black"
          >
            ← Back to VIN Search
          </Link>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-red-300">
            Free Basic VIN Check
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-tight">{title}</h1>

          <p className="mt-3 text-white/70">VIN: {vin}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pt-10">
        <form
          action="/vin-report/result"
          method="GET"
          className="rounded-3xl border bg-white p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-red-600">
            Check Another VIN
          </p>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              name="vin"
              placeholder="Enter another 17-character VIN"
              maxLength={17}
              className="h-14 rounded-2xl border px-4 font-bold uppercase outline-none focus:border-red-600"
            />

            <button
              type="submit"
              className="h-14 rounded-2xl bg-red-600 px-7 font-black text-white hover:bg-red-700"
            >
              Check VIN
            </button>
          </div>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-xl font-black">Important Note</h2>
          <p className="mt-2 leading-7">
            This is a free basic VIN decode from the official NHTSA vPIC
            database. It is <strong>not a Carfax or AutoCheck report</strong>{" "}
            and does not guarantee accident history, prior ownership, service
            records, title brands, or odometer accuracy. For a complete
            history, use a dedicated vehicle history provider.
          </p>
        </div>

        {decodeError ? (
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">Couldn&apos;t Decode This VIN</h2>
            <p className="mt-2 text-gray-600">{decodeError}</p>
            <Link
              href="/vin-report"
              className="mt-6 inline-block rounded-2xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
            >
              Try Again
            </Link>
          </div>
        ) : !decoded?.hasData ? (
          <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black">No Data Available</h2>
            <p className="mt-2 text-gray-600">
              NHTSA doesn&apos;t have decoded data for this VIN. Please
              double-check the number and try again.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <VinDecodedInfoPanel
                fields={{
                  year: decoded.year,
                  make: decoded.make,
                  model: decoded.model,
                  trim: decoded.trim,
                  body: decoded.body,
                  engine: decoded.engine,
                  transmission: decoded.transmission,
                  fuel: decoded.fuel,
                  driveType: decoded.driveType,
                  manufacturer: decoded.manufacturer,
                  plantCountry: decoded.plantCountry,
                  plantState: decoded.plantState,
                  plantCity: decoded.plantCity,
                  source: decoded.source,
                  decodedAt: decoded.decodedAt,
                  cached: decoded.cached,
                }}
              />

              <div className="rounded-3xl border bg-white p-8 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  {recallResult?.recalls.length ? (
                    <ShieldAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-green-600" aria-hidden="true" />
                  )}
                  <h2 className="text-2xl font-black">Safety Recall Check</h2>
                </div>

                {!recallResult ? (
                  <p className="text-gray-500">
                    Recall check requires a decoded make, model, and year.
                  </p>
                ) : recallResult.error ? (
                  <p className="text-gray-500">{recallResult.error}</p>
                ) : recallResult.recalls.length === 0 ? (
                  <p className="text-gray-600">
                    No open NHTSA safety recalls were found for this{" "}
                    {decoded.year} {decoded.make} {decoded.model}.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-red-700">
                      {recallResult.recalls.length} open recall
                      {recallResult.recalls.length === 1 ? "" : "s"} found for
                      this {decoded.year} {decoded.make} {decoded.model}.
                    </p>
                    {recallResult.recalls.map((r) => (
                      <div
                        key={r.campaignNumber}
                        className="rounded-2xl border border-red-200 bg-red-50 p-4"
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                          Campaign {r.campaignNumber} &middot; {r.reportedDate}
                        </p>
                        <p className="mt-1 font-black text-gray-900">{r.component}</p>
                        <p className="mt-2 text-sm text-gray-700">{r.summary}</p>
                        {r.remedy && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-bold">Remedy: </span>
                            {r.remedy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-400">
                  Source: NHTSA Recalls API — safety recalls only, not a
                  complete history report.
                </p>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">History Status</h3>

                <div className="mt-5 space-y-3">
                  <StatusRow label="Title Status" value="Not available in free decode" />
                  <StatusRow label="Accident History" value="Not available in free decode" />
                  <StatusRow label="Salvage / Rebuilt" value="Not available in free decode" />
                  <StatusRow label="Lienholder" value="Not available in free decode" />
                  <StatusRow label="Ownership History" value="Not available in free decode" />
                </div>
              </div>

              <div className="rounded-3xl bg-black p-6 text-white shadow-sm">
                <h3 className="text-xl font-black">Need a Vehicle?</h3>
                <p className="mt-2 text-white/70">
                  Browse available vehicles or call Drive Prime Motors for
                  help.
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
        )}
      </section>
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
