import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

export default async function sitemap() {

  await connectDB();

  const cars = await Car.find().lean();

  const inventory = cars.map((car: any) => ({
    url: `https://driveprimemotorsllc.com/inventory/${car._id}`,
    lastModified: new Date(),
  }));

  const vins = cars
    .filter((car: any) => car.vin)
    .map((car: any) => ({
      url: `https://driveprimemotorsllc.com/vin/${car.vin}`,
      lastModified: new Date(),
    }));

  const seoPages = [

    "toyota-prius-for-sale-sacramento",
    "toyota-camry-for-sale-sacramento",
    "honda-civic-for-sale-sacramento",
    "honda-accord-for-sale-sacramento",
    "ford-f150-for-sale-sacramento",
    "nissan-altima-for-sale-sacramento",
    "used-cars-sacramento",
    "cheap-cars-sacramento",
    "best-used-cars-sacramento",
    "toyota-camry-for-sale-roseville",
"honda-civic-for-sale-roseville",
"ford-f150-for-sale-roseville",

"toyota-camry-for-sale-folsom",
"honda-civic-for-sale-folsom",

  ].map(slug => ({
    url: `https://driveprimemotorsllc.com/cars/${slug}`,
    lastModified: new Date(),
  }));

  return [

    {
      url: "https://driveprimemotorsllc.com",
      lastModified: new Date(),
    },

    {
      url: "https://driveprimemotorsllc.com/inventory",
      lastModified: new Date(),
    },

    {
      url: "https://driveprimemotorsllc.com/vin-report",
      lastModified: new Date(),
    },

    ...seoPages,
    ...inventory,
    ...vins

  ];
}