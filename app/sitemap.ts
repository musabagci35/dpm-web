export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

const SITE_URL = "https://driveprimemotorsllc.com";

export default async function sitemap() {
  await connectDB();

  const cars = await Car.find({
    isActive: true,
    status: { $nin: ["sold", "archived"] },
  }).lean();

  const inventory = cars.map((car: any) => ({
    url: `${SITE_URL}/inventory/${car.slug || car._id}`,
    lastModified: car.updatedAt || new Date(),
  }));

  const seoPages = [
    "used-cars-sacramento",
    "used-cars-rancho-cordova",
    "car-financing-sacramento",
    "sell-my-car-sacramento",
    "auto-parts-sacramento",
  ].map((slug) => ({
    url: `${SITE_URL}/cars/${slug}`,
    lastModified: new Date(),
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/inventory`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/financing`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/sell-your-car`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/parts`,
      lastModified: new Date(),
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
    },
    ...seoPages,
    ...inventory,
  ];
}
