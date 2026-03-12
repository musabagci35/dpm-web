import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import OfferActions from "./OfferActions";

export default async function AdminOffersPage() {
  await connectDB();
  const offers = await Offer.find({})
    .sort({ createdAt: -1 })
    .populate("carId")
    .lean();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">Offers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage buyer offers (accept / reject / counter).
          </p>
        </div>

        <Link href="/inventory" className="rounded-xl border px-4 py-2 text-sm">
          Back to Inventory
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {offers.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center">
            No offers yet.
          </div>
        ) : (
          offers.map((o: any) => {
            const car = o.carId;
            const title = car ? `${car.year} ${car.make} ${car.model}` : "Unknown car";

            return (
              <div key={o._id.toString()} className="rounded-2xl border bg-white p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Status: <span className="font-semibold text-black">{o.status}</span>
                      {o.counterAmount ? (
                        <span className="ml-3 text-gray-600">
                          Counter: <span className="font-semibold">${Number(o.counterAmount).toLocaleString()}</span>
                        </span>
                      ) : null}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">{title}</h2>

                    <p className="mt-1 text-sm text-gray-700">
                      Offer: <span className="font-semibold">${Number(o.amount).toLocaleString()}</span>
                    </p>

                    <p className="mt-2 text-sm text-gray-600">
                      Buyer: {o.buyerName} • {o.buyerPhone}
                      {o.buyerEmail ? ` • ${o.buyerEmail}` : ""}
                    </p>
                  </div>

                  <OfferActions offerId={o._id.toString()} status={o.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}