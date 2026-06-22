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

  const car = {
    ...carRaw,
    _id: carRaw._id.toString(),
  };

  const title = car.title || `${car.year} ${car.make} ${car.model}`;
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

      {/* TOP PROMO BAR */}
      <section className="bg-red-700 py-3 text-center text-sm font-bold text-white">
        Quality Pre-Owned Vehicles • Easy Financing • Rancho Cordova, CA
      </section>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* BREADCRUMB */}
          <div className="mb-5 text-sm text-gray-500">
            <Link href="/" className="hover:underline">
              Drive Prime Motors
            </Link>{" "}
            /{" "}
            <Link href="/inventory" className="hover:underline">
              Inventory
            </Link>{" "}
            / <span>{title}</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
            {/* LEFT SIDE */}
            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="relative">
                {car.isFeatured && (
                  <div className="absolute left-0 top-0 z-10 bg-red-700 px-5 py-2 text-xs font-bold uppercase text-white">
                    Featured Vehicle
                  </div>
                )}

                <Gallery images={images} />
              </div>

              <div className="border-t p-5">
                <h1 className="text-3xl font-extrabold">{title}</h1>

                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>
                    {mileage ? mileage.toLocaleString() : "N/A"} miles
                  </span>
                  <span>VIN: {car.vin || "N/A"}</span>
                  <span>Status: {(car.status || "available").toUpperCase()}</span>
                </div>
              </div>

              <div className="border-t bg-white p-5">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-700">
                    This vehicle is available now. Contact us to confirm before
                    visiting.
                  </div>

                  <a
                    href="tel:+19162618880"
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
                  >
                    Call
                  </a>
                </div>
              </div>

              <div className="border-t p-6">
                <h2 className="mb-4 text-xl font-bold">
                  {title} Details
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailRow label="Condition" value="Pre-owned" />
                  <DetailRow label="Year" value={car.year} />
                  <DetailRow label="Make" value={car.make} />
                  <DetailRow label="Model" value={car.model} />
                  <DetailRow
                    label="Mileage"
                    value={mileage ? mileage.toLocaleString() : "N/A"}
                  />
                  <DetailRow label="VIN" value={car.vin || "N/A"} />
                  <DetailRow label="Fuel Type" value="Gasoline" />
                  <DetailRow label="Transmission" value="Automatic" />
                </div>
                {car.videoUrl && (
  <div className="mt-8">
    <h3 className="text-xl font-bold mb-3">
      Vehicle Video
    </h3>

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
                    <h3 className="mb-3 text-lg font-bold">Description</h3>
                    <p className="leading-relaxed text-gray-700">
                      {car.description}
                    </p>
                  </div>
                )}

                {car.vin && (
                  <div className="mt-8 rounded-xl border bg-blue-50 p-5">
                    <p className="font-semibold">Vehicle history available</p>
                    <Link
                      href={`/vin/${car.vin}`}
                      className="mt-2 inline-block text-blue-700 underline"
                    >
                      View VIN Report →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* RIGHT PRICE CARD */}
            <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <p className="text-sm text-gray-500">Price</p>
              <div className="mt-1 text-3xl font-extrabold">
                ${salePrice.toLocaleString()}
              </div>

              <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">Estimated Payment</span>
                  <span>${monthly.toLocaleString()} / mo.</span>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-sm">
                <PriceRow label="Original price" value={price} />
                <PriceRow label="Dealer Documentation Fee" value={docFee} />
                <div className="border-t pt-2">
                  <PriceRow label="Sale price" value={salePrice} bold />
                </div>
              </div>

              <div className="mt-5 rounded-xl border p-3 text-sm">
                📍 Drive Prime Motors LLC — Rancho Cordova, CA
              </div>

              <div className="mt-5 space-y-3">
                <a
                  href="tel:+19162618880"
                  className="block rounded-xl bg-red-700 py-3 text-center font-bold text-white hover:bg-red-800"
                >
                  Confirm Availability
                </a>

                <Link
                  href="/financing"
                  className="block rounded-xl border py-3 text-center font-bold hover:bg-gray-50"
                >
                  Get Approved
                </Link>

                <a
                  href="#schedule"
                  className="block rounded-xl border py-3 text-center font-bold hover:bg-gray-50"
                >
                  Schedule Test Drive
                </a>
              </div>

              <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-xl border text-center text-sm">
                <button className="p-4 hover:bg-gray-50">Share</button>
                <a href="#questions" className="border-x p-4 hover:bg-gray-50">
                  Questions?
                </a>
                <button className="p-4 hover:bg-gray-50">Save</button>
              </div>

              <div className="mt-5 rounded-xl bg-red-700 p-5 text-white">
                <div className="text-lg font-bold">What’s your car worth?</div>
                <p className="text-sm text-white/80">
                  Get your trade-in value today.
                </p>
                <Link
                  href="/sell-your-car"
                  className="mt-3 inline-block rounded-lg bg-white px-4 py-2 text-sm font-bold text-red-700"
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
    <div className="grid grid-cols-2 border-b py-3 text-sm">
      <div className="font-semibold text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
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
      <span className={bold ? "font-bold" : "text-gray-600"}>{label}</span>
      <span className={bold ? "font-bold" : ""}>
        ${Number(value || 0).toLocaleString()}
      </span>
    </div>
  );
}