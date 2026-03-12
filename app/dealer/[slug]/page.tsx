import { connectDB } from "@/lib/mongodb";
import Dealer from "@/models/Dealer";
import Car from "@/models/Car";
import Link from "next/link";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function DealerStorefrontPage({ params }: Props) {
  const { slug } = await params;

  await connectDB();

  const dealer: any = await Dealer.findOne({ slug, isActive: true }).lean();

  if (!dealer) {
    return <div className="p-10">Dealer not found</div>;
  }

  const cars: any[] = await Car.find({
    dealerId: dealer._id,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">{dealer.name}</h1>
      <p className="mt-2 text-gray-600">Inventory for this dealer</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => {
          const img = car.images?.[0]?.url || "/car.png";
          const id = car._id.toString();

          return (
            <div key={id} className="rounded-2xl border bg-white overflow-hidden">
              <img src={img} alt="vehicle" className="h-56 w-full object-cover" />
              <div className="p-4">
                <div className="font-semibold">
                  {car.year} {car.make} {car.model}
                </div>
                <div className="mt-2 text-lg font-bold">
                  {car.price ? `$${Number(car.price).toLocaleString()}` : "Call for price"}
                </div>
                <Link
                  href={`/inventory/${id}`}
                  className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm text-white"
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}