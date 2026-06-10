import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
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
      url: `https://driveprimemotors.com/inventory/${id}`,
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

  if (!carRaw) {
    return notFound();
  }

  const car = {
    ...carRaw,
    _id: carRaw._id.toString(),
  };

  const title =
    car.title || `${car.year} ${car.make} ${car.model}`;

  const price = Number(car.price || 0);
  const mileage = car.mileage ? Number(car.mileage) : null;

  const monthly = price
    ? Math.round((price * 1.15) / 60)
    : 0;

  const images =
    car.images?.length > 0
      ? car.images.map((img: any) => ({
          url: img.url.replace(
            "/upload/",
            "/upload/f_auto,q_auto,w_1200/"
          ),
        }))
      : [{ url: "/car-placeholder.jpg" }];

  const mainImage = images[0]?.url || "/car-placeholder.jpg";

  const schema = buildSchema(
    car,
    car.slug || car._id,
    title,
    price,
    mainImage
  );

  return (
    <>
      {/* SEO SCHEMA */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-16 pb-24">
        {/* GRID */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* GALLERY */}
          <div>
            <p className="text-sm text-gray-500 mb-2">
              📸 {images.length} photos
            </p>

            <Gallery images={images} />
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:sticky lg:top-24 h-fit rounded-2xl border bg-white p-8 shadow-lg">
            {/* TITLE */}
            <h1 className="text-2xl font-bold">
              {title}
            </h1>

            {/* BADGES */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                ✔ Dealer Inspected
              </span>

              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              ✔ Title Status Available
              </span>

              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                ✔ Financing Available
              </span>
            </div>

            {/* MILEAGE */}
            {mileage && (
              <p className="mt-3 text-sm text-gray-500">
                {mileage.toLocaleString()} miles
              </p>
            )}

            {/* PRICE */}
            <p className="mt-5 text-4xl font-extrabold text-red-600">
              ${price.toLocaleString()}
            </p>

            <p className="text-sm text-gray-600">
  💰 Estimated ${monthly.toLocaleString()}/month
</p>

            {/* URGENCY */}
            <div className="mt-2 text-xs text-red-600 font-semibold">
              🔥 High demand – this vehicle may sell soon
            </div>

            {/* CTA */}
            <div className="mt-6 space-y-3">
              <Link
                href="/financing"
                className="block w-full text-center rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
              >
                Get Approved Now
              </Link>

              <a
                href="tel:+19162618880"
                className="block w-full text-center rounded-xl border py-3 font-semibold hover:bg-gray-50"
              >
                Call Now
              </a>
            </div>

            {/* LEAD FORM */}
            <div className="mt-6">
              <DetailLeadForm carTitle={title} />
            </div>

            {/* TEST DRIVE FORM */}
            <AppointmentForm
              carId={car._id}
              carTitle={title}
            />
          </div>
        </div>

        {/* DETAILS */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold">
            Vehicle Details
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            Everything you need to know about this vehicle
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <DetailItem label="Year" value={car.year} />

            <DetailItem label="Make" value={car.make} />

            <DetailItem label="Model" value={car.model} />

            <DetailItem
              label="Mileage"
              value={
                mileage
                  ? mileage.toLocaleString()
                  : "N/A"
              }
            />

            <DetailItem
              label="Price"
              value={`$${price.toLocaleString()}`}
            />

            <DetailItem
              label="VIN"
              value={car.vin || "N/A"}
            />
          </div>

          {/* VIN CTA */}
          {car.vin && (
            <div className="mt-8 p-5 rounded-xl bg-blue-50 border">
              <p className="font-semibold">
                Check full vehicle history
              </p>

              <Link
                href={`/vin/${car.vin}`}
                className="text-blue-600 underline mt-2 inline-block"
              >
                View VIN Report →
              </Link>
            </div>
          )}

          {/* DESCRIPTION */}
          {car.description && (
            <div className="mt-10">
              <h3 className="text-xl font-bold mb-3">
                Description
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {car.description}
              </p>
            </div>
          )}
        </div>

        {/* MOBILE CTA */}
        <MobileCTA price={price} />
      </div>
    </>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="border p-4 rounded-xl">
      <strong>{label}:</strong> {value}
    </div>
  );
}