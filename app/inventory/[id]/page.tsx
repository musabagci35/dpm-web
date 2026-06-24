
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { proImage } from "@/lib/cloudinaryImage";
import Car from "@/models/Car";
import Link from "next/link";

import Gallery from "./Gallery";
import DetailLeadForm from "./DetailLeadForm";
import MobileCTA from "./MobileCTA";
import AppointmentForm from "./AppointmentForm";

function maskVin(vin?: string) {
  if (!vin) return "N/A";
  return `***********${vin.slice(-6).toUpperCase()}`;
}

function formatMileage(mileage?: number | null) {
  if (!mileage || mileage <= 0) return "N/A";
  return `${Number(mileage).toLocaleString()} miles`;
}

function buildSchema(
  car: any,
  id: string,
  title: string,
  price: number,
  image: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: { "@type": "Brand", name: car.make },
    model: car.model,
    vehicleModelDate: car.year,
    vehicleIdentificationNumber: car.vin || "",
    image: [image],
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://www.driveprimemotorsllc.com/inventory/${id}`,
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();

  const carRaw: any = mongoose.Types.ObjectId.isValid(id)
    ? await Car.findById(id).lean()
    : await Car.findOne({ slug: id }).lean();

  if (!carRaw) return notFound();

  if (
    carRaw.status === "archived" ||
    carRaw.status === "sold" ||
    carRaw.isActive === false
  ) {
    return notFound();
  }

  const car = {
    ...carRaw,
    _id: carRaw._id.toString(),
  };

  const title =
    car.title ||
    `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim();

  const price = Number(car.price || 0);
  const mileage = car.mileage ? Number(car.mileage) : null;
  const docFee = Number(car.docFee || 0);
  const salePrice = price + docFee;
  const monthly = price ? Math.round((salePrice * 1.15) / 60) : 0;

  const images =
    car.images?.length > 0
      ? car.images.map((img: any) => ({
          url: proImage(img.url),
        }))
      : [{ url: "/car-placeholder.jpg" }];

  const mainImage = images[0]?.url || "/car-placeholder.jpg";

  const schema = buildSchema(
    car,
    car.slug || car._id,
    title,
    salePrice,
    mainImage
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <section className="bg-red-700 py-3 text-center text-sm font-black text-white">
        Quality Pre-Owned Vehicles • Easy Financing • Sacramento Area Dealer
      </section>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-5 text-sm text-gray-500">
            <Link href="/" className="hover:text-red-600">
              Drive Prime Motors
            </Link>{" "}
            /{" "}
            <Link href="/inventory" className="hover:text-red-600">
              Inventory
            </Link>{" "}
            / <span className="text-gray-800">{title}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_410px]">
            <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
              <div className="relative">
                {car.isFeatured && (
                  <div className="absolute left-4 top-4 z-10 rounded-full bg-red-700 px-4 py-2 text-xs font-black uppercase text-white shadow">
                    Featured Vehicle
                  </div>
                )}

                <Gallery images={images} />
              </div>

              <div className="border-t p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                      {title}
                    </h1>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="rounded-full bg-gray-100 px-3 py-2 font-semibold">
                        {formatMileage(mileage)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-3 py-2 font-semibold">
                        VIN: {maskVin(car.vin)}
                      </span>
                      <span className="rounded-full bg-green-100 px-3 py-2 font-black text-green-700">
                        {(car.status || "available").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-4 text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                      Internet Price
                    </p>
                    <p className="text-3xl font-black text-green-700">
                      ${salePrice.toLocaleString()}
                    </p>
                    {monthly > 0 && (
                      <p className="text-sm font-semibold text-green-800">
                        Est. ${monthly.toLocaleString()}/mo
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t bg-white p-6">
                <div className="flex flex-col gap-4 rounded-2xl bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black text-gray-900">
                      This vehicle is available now.
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Call before visiting to confirm availability and schedule a test drive.
                    </p>
                  </div>

                  <a
                    href="tel:+19162618880"
                    className="rounded-xl bg-red-700 px-5 py-3 text-center text-sm font-black text-white hover:bg-red-800"
                  >
                    Call (916) 261-8880
                  </a>
                </div>
              </div>

              <div className="border-t p-6">
                <h2 className="mb-5 text-2xl font-black">{title} Details</h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailRow label="Condition" value="Pre-owned" />
                  <DetailRow label="Year" value={car.year} />
                  <DetailRow label="Make" value={car.make} />
                  <DetailRow label="Model" value={car.model} />
                  {car.trim && <DetailRow label="Trim" value={car.trim} />}
                  <DetailRow label="Mileage" value={formatMileage(mileage)} />
                  <DetailRow label="VIN" value={maskVin(car.vin)} />
                  <DetailRow
                    label="Status"
                    value={(car.status || "available").toUpperCase()}
                  />
                </div>

                {car.videoUrl && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-xl font-black">Vehicle Video</h3>

                    <div className="aspect-video overflow-hidden rounded-2xl">
                      <iframe
                        src={car.videoUrl
                          .replace("watch?v=", "embed/")
                          .replace("youtu.be/", "youtube.com/embed/")}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {car.description && (
                  <div className="mt-8">
                    <h3 className="mb-3 text-xl font-black">Description</h3>
                    <p className="whitespace-pre-line leading-relaxed text-gray-700">
                      {car.description}
                    </p>
                  </div>
                )}

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <TrustCard
                    title="Dealer Inspected"
                    text="Reviewed before being listed for sale."
                  />
                  <TrustCard
                    title="Financing Available"
                    text="Apply online and move forward faster."
                  />
                  <TrustCard
                    title="Trade-Ins Welcome"
                    text="Sell or trade your current vehicle."
                  />
                </div>

                {car.vin && (
                  <div className="mt-8 rounded-2xl border bg-blue-50 p-5">
                    <p className="font-black text-blue-950">
                      Vehicle history available
                    </p>
                    <p className="mt-1 text-sm text-blue-800">
                      View available VIN information for this vehicle.
                    </p>
                    <Link
                      href={`/vin/${car.vin}`}
                      className="mt-3 inline-block font-black text-blue-700 underline"
                    >
                      View VIN Report →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm lg:sticky lg:top-28">
              <div className="mb-4 rounded-xl bg-green-100 px-4 py-3 text-center text-sm font-black text-green-700">
                ✓ Available Today • Call Before Visiting
              </div>

              <p className="text-sm font-semibold text-gray-500">Internet Price</p>
              <div className="mt-1 text-4xl font-black text-gray-900">
                ${salePrice.toLocaleString()}
              </div>

              {monthly > 0 && (
                <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-black">Estimated Payment</span>
                    <span className="font-black text-green-700">
                      ${monthly.toLocaleString()} / mo.
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Estimate only. Final terms may vary.
                  </p>
                </div>
              )}

              <div className="mt-5 space-y-2 text-sm">
                <PriceRow label="Vehicle price" value={price} />
                {docFee > 0 && (
                  <PriceRow label="Dealer documentation fee" value={docFee} />
                )}
                <div className="border-t pt-2">
                  <PriceRow label="Listed price" value={salePrice} bold />
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                <h3 className="font-black text-blue-950">Financing Available</h3>
                <p className="mt-1 text-sm text-blue-800">
                  Bad Credit? No Credit? First-Time Buyer? Apply online today.
                </p>
              </div>

              <div className="mt-5 rounded-2xl border p-4 text-sm font-semibold text-gray-700">
                📍 Drive Prime Motors LLC — Sacramento / Rancho Cordova Area
              </div>

              <div className="mt-5 space-y-3">
                <a
                  href="tel:+19162618880"
                  className="block rounded-2xl bg-red-700 py-4 text-center font-black text-white hover:bg-red-800"
                >
                  Confirm Availability
                </a>

                <Link
                  href="/financing"
                  className="block rounded-2xl border py-4 text-center font-black hover:bg-gray-50"
                >
                  Get Approved
                </Link>

                <a
                  href="#schedule"
                  className="block rounded-2xl border py-4 text-center font-black hover:bg-gray-50"
                >
                  Schedule Test Drive
                </a>
              </div>

              <div className="mt-5 rounded-2xl bg-red-700 p-5 text-white">
                <div className="text-lg font-black">What’s your car worth?</div>
                <p className="mt-1 text-sm text-white/80">
                  Get a fast trade-in or sell-your-car offer today.
                </p>
                <Link
                  href="/sell-your-car"
                  className="mt-3 inline-block rounded-xl bg-white px-4 py-2 text-sm font-black text-red-700"
                >
                  Trade / Sell
                </Link>
              </div>

              <div id="questions" className="mt-6">
                <DetailLeadForm carTitle={title} />
              </div>

              <div id="schedule" className="mt-6">
                <AppointmentForm carId={car._id} carTitle={title} />
              </div>
            </aside>
          </div>
        </div>

        <MobileCTA price={salePrice} />
      </main>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 text-sm">
      <div className="font-semibold text-gray-500">{label}</div>
      <div className="mt-1 font-black text-gray-900">{value}</div>
    </div>
  );
}

function TrustCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 font-black text-red-700">
        ✓
      </div>
      <h3 className="font-black">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "font-black" : "text-gray-600"}>{label}</span>
      <span className={bold ? "font-black" : ""}>
        ${Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}
