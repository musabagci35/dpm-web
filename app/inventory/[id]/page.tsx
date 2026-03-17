import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Link from "next/link";
import Gallery from "./Gallery";
import DetailLeadForm from "./DetailLeadForm";

import MobileCTA from "./MobileCTA";

function buildVehicleSchema({
  id,
  title,
  car,
  price,
  mileage,
  image,
}: {
  id: string;
  title: string;
  car: any;
  price: number;
  mileage: number | null;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    brand: {
      "@type": "Brand",
      name: car.make || "",
    },
    model: car.model || "",
    vehicleModelDate: car.year || "",
    vehicleIdentificationNumber: car.vin || "",
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: mileage || 0,
      unitCode: "SMI",
    },
    image: [image],
    description:
      car.description ||
      `${title} available at Drive Prime Motors in Sacramento California.`,
    offers: {
      "@type": "Offer",
      price: price || 0,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://driveprimemotorsllc.com/inventory/${id}`,
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "AutoDealer",
        name: "Drive Prime Motors",
        url: "https://driveprimemotorsllc.com",
      },
    },
  };
}

export async function generateMetadata({ params }: any) {
  const { id } = await params;

  await connectDB();

  const car: any = await Car.findById(id).lean();

  if (!car) return {};

  const title = `${car.year} ${car.make} ${car.model} for sale | Drive Prime Motors`;

  const description = `${car.year} ${car.make} ${car.model} available at Drive Prime Motors in California. Financing available.`;

  const image = car.images?.[0]?.url || "/car-placeholder.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      url: `https://driveprimemotorsllc.com/inventory/${id}`,
      siteName: "Drive Prime Motors",
      type: "website",
    },
  };
}

type Props = {
  params: { id: string };
};

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return notFound();
  }

  await connectDB();

  const carRaw: any = await Car.findById(id).lean();

  if (!carRaw) return notFound();

  const car = {
    ...carRaw,
    _id: carRaw._id.toString(),
  };

  const title = `${car.year} ${car.make} ${car.model}`;

  const price = Number(car.price || 0);
  const mileage = car.mileage ? Number(car.mileage) : null;

  const monthly = price ? Math.round((price * 1.15) / 60) : 0;

  const images =
    car.images?.length > 0
      ? car.images.map((img: any) => ({
          url: img.url.replace(
            "/upload/",
            "/upload/f_auto,q_auto,w_1200/"
          ),
        }))
      : [
          {
            url: "/car-placeholder.jpg",
          },
        ];

  const image =
    images?.[0]?.url ||
    "https://driveprimemotorsllc.com/car-placeholder.jpg";

  const vehicleSchema = buildVehicleSchema({
    id,
    title,
    car,
    price,
    mileage,
    image,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(vehicleSchema),
        }}
      />

      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-10 lg:grid-cols-2">

          <Gallery images={images} />

          <div className="lg:sticky lg:top-24 h-fit rounded-2xl border bg-white p-8 shadow-lg">

            <h1 className="text-2xl font-bold">{title}</h1>

            {mileage && (
              <p className="mt-2 text-sm text-gray-500">
                {mileage.toLocaleString()} miles
              </p>
            )}

            <p className="mt-4 text-4xl font-extrabold text-red-600">
              ${price.toLocaleString()}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Est. from ${monthly.toLocaleString()} / month*
            </p>

            <div className="mt-6 space-y-4">

              <Link
                href="/financing"
                className="block w-full text-center rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 transition"
              >
                Get Approved Now
              </Link>

              <a
                href="tel:+19162618880"
                className="block w-full text-center rounded-xl border py-3 font-semibold hover:bg-gray-50 transition"
              >
                Call Now 916-261-8880
              </a>

            </div>

            <DetailLeadForm carTitle={title} />

          </div>

        </div>

        <div className="mt-16">

          <h2 className="text-2xl font-bold mb-6">
            Vehicle Details
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">

            <div className="border p-4 rounded-xl">
              <strong>Year:</strong> {car.year}
            </div>

            <div className="border p-4 rounded-xl">
              <strong>Make:</strong> {car.make}
            </div>

            <div className="border p-4 rounded-xl">
              <strong>Model:</strong> {car.model}
            </div>

            <div className="border p-4 rounded-xl">
              <strong>Mileage:</strong>{" "}
              {mileage ? mileage.toLocaleString() : "N/A"}
            </div>

            <div className="border p-4 rounded-xl">
              <strong>Price:</strong> ${price.toLocaleString()}
            </div>

            <div className="border p-4 rounded-xl">
              <strong>VIN:</strong> {car.vin || "N/A"}
            </div>
            {car.vin && (
  <div className="border p-4 rounded-xl">
    <strong>VIN Report:</strong>{" "}
    <Link
      href={`/vin/${car.vin}`}
      className="text-blue-600 underline"
    >
      Check VIN Report
    </Link>
  </div>
)}

          </div>

          {car.description && (
            <div className="mt-10">

              <h3 className="text-xl font-bold mb-4">
                Description
              </h3>

             

              <p className="text-gray-600 leading-relaxed">
                {car.description}
              </p>

            </div>
          )}

        

        </div>

        <MobileCTA price={price} />

      </div>
    </>
  );
}