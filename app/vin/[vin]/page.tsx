import Image from "next/image";
import { headers } from "next/headers";
import AuctionIntelligencePanel from "@/components/AuctionIntelligencePanel";
import VehicleHistoryPanel from "@/components/VehicleHistoryPanel";
import { getVinDecodeResult, VinDecodeError, isValidVin } from "@/lib/vinDecode";

type Props = {
  params: Promise<{ vin: string }>;
};

async function getClientIp() {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export default async function VinPage({ params }: Props) {
  const { vin } = await params;
  const cleanVin = vin.trim().toUpperCase();

  let decoded: Awaited<ReturnType<typeof getVinDecodeResult>> | null = null;
  let decodeError = "";

  if (!isValidVin(cleanVin)) {
    decodeError = "This VIN isn't in a valid 17-character format.";
  } else {
    try {
      const ip = await getClientIp();
      decoded = await getVinDecodeResult(cleanVin, { ip, rateLimitMax: 15 });
    } catch (err) {
      decodeError =
        err instanceof VinDecodeError
          ? err.message
          : "VIN decode failed. Please try again.";
    }
  }

  const make = decoded?.make || "Unknown";
  const model = decoded?.model || "Unknown";
  const year = decoded?.year ? Number(decoded.year) || 0 : 0;
  const trim = decoded?.trim || "";
  const fuel = decoded?.fuel || "—";
  const body = decoded?.body || "—";
  const manufacturer = decoded?.manufacturer || "—";
  const doors = decoded?.doors || "—";
  const driveType = decoded?.driveType || "—";
  const transmission = decoded?.transmission || "—";
  const decodeSucceeded = Boolean(decoded?.hasData);

  const imageUrl = `https://cdn.imagin.studio/getimage?customer=img&make=${encodeURIComponent(
    make
  )}&modelFamily=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(
    String(year || "2020")
  )}&zoomType=fullscreen&angle=front`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {decodeError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {decodeError}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[420px] rounded-2xl border bg-white p-6 flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={`${year} ${make} ${model}`}
              width={1200}
              height={800}
              className="h-[360px] w-full rounded-xl object-contain"
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

              {decoded && (
                <p className="mt-4 text-xs text-gray-400">
                  Source: {decoded.source}
                  {decoded.cached ? " (cached)" : ""}
                </p>
              )}
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-2xl font-bold">Dealer Vehicle Report</div>

              <div className="mt-4 rounded-xl bg-red-50 p-4">
                <div className="text-sm font-bold text-red-700">
                  Dealer Price
                </div>
                <div className="mt-1 text-4xl font-black text-gray-900">
                  Contact Dealer
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Price depends on mileage, condition, options, smog, title, and
                  documentation.
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <strong>VIN Decode</strong>
                  <span>{decodeSucceeded ? "Completed" : "No Data Found"}</span>
                </div>

                <div className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <strong>Dealer Review</strong>
                  <span>Available</span>
                </div>

                <div className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <strong>Documents</strong>
                  <span>Available upon request</span>
                </div>

                <div className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <strong>Status</strong>
                  <span>Ready for buyer review</span>
                </div>
              </div>

              <a
                href="tel:+19162618880"
                className="mt-5 block rounded-2xl bg-red-600 px-5 py-4 text-center font-black text-white hover:bg-red-700"
              >
                Call Drive Prime Motors
              </a>
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
