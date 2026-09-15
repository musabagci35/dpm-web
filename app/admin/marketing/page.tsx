export const dynamic = "force-dynamic";
export const revalidate = 0;

import { connectDB } from "@/lib/mongodb";
import { proThumb } from "@/lib/cloudinaryImage";
import Car from "@/models/Car";
import MarketingCenterClient from "@/components/admin/MarketingCenterClient";

type Props = {
  searchParams: Promise<{ carId?: string }>;
};

export default async function MarketingCenterPage({ searchParams }: Props) {
  await connectDB();

  const params = (await searchParams) || {};

  const [
    cars,
    facebookPublishedCount,
    craigslistCopiedCount,
    offerupCopiedCount,
    lastFacebookCar,
    lastCraigslistCar,
    lastOfferupCar,
  ] = await Promise.all([
    Car.find({ status: { $ne: "archived" } })
      .select("year make model trim price mileage description status images marketing slug title")
      .sort({ createdAt: -1 })
      .lean(),
    Car.countDocuments({ "marketing.facebookPosted": true }),
    Car.countDocuments({ "marketing.craigslistReady": true }),
    Car.countDocuments({ "marketing.offerupReady": true }),
    Car.findOne({ "marketing.facebookLastPublishedAt": { $ne: null } })
      .sort({ "marketing.facebookLastPublishedAt": -1 })
      .select("marketing.facebookLastPublishedAt")
      .lean(),
    Car.findOne({ "marketing.craigslistLastCopiedAt": { $ne: null } })
      .sort({ "marketing.craigslistLastCopiedAt": -1 })
      .select("marketing.craigslistLastCopiedAt")
      .lean(),
    Car.findOne({ "marketing.offerupLastCopiedAt": { $ne: null } })
      .sort({ "marketing.offerupLastCopiedAt": -1 })
      .select("marketing.offerupLastCopiedAt")
      .lean(),
  ]);

  const vehicles = cars.map((car: any) => ({
    id: car._id.toString(),
    slug: car.slug || car._id.toString(),
    title:
      car.title || `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim(),
    year: car.year,
    make: car.make,
    model: car.model,
    trim: car.trim || "",
    price: Number(car.price || 0),
    mileage: Number(car.mileage || 0),
    description: car.description || "",
    status: car.status || "available",
    image: proThumb(
      car.images?.find((i: any) => i.isCover)?.url || car.images?.[0]?.url || ""
    ),
    marketing: {
      facebookPosted: !!car.marketing?.facebookPosted,
      facebookLastPublishedAt: car.marketing?.facebookLastPublishedAt || null,
      facebookLastError: car.marketing?.facebookLastError || "",
      craigslistReady: !!car.marketing?.craigslistReady,
      craigslistLastCopiedAt: car.marketing?.craigslistLastCopiedAt || null,
      offerupReady: !!car.marketing?.offerupReady,
      offerupLastCopiedAt: car.marketing?.offerupLastCopiedAt || null,
    },
  }));

  const connections = {
    facebook: Boolean(
      process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN
    ),
    craigslist: false,
    offerup: false,
    ebay: false,
  };

  const channelStats = {
    facebook: {
      publishedCount: facebookPublishedCount,
      lastPublishedAt:
        (lastFacebookCar as any)?.marketing?.facebookLastPublishedAt || null,
    },
    craigslist: {
      publishedCount: craigslistCopiedCount,
      lastPublishedAt:
        (lastCraigslistCar as any)?.marketing?.craigslistLastCopiedAt || null,
    },
    offerup: {
      publishedCount: offerupCopiedCount,
      lastPublishedAt:
        (lastOfferupCar as any)?.marketing?.offerupLastCopiedAt || null,
    },
    ebay: { publishedCount: 0, lastPublishedAt: null },
  };

  return (
    <MarketingCenterClient
      vehicles={vehicles}
      connections={connections}
      channelStats={channelStats}
      initialCarId={params.carId || null}
    />
  );
}
