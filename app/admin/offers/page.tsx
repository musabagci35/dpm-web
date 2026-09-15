export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { HandCoins } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import Offer from "@/models/Offer";
import Car from "@/models/Car";
import OfferActions from "@/components/admin/OfferActions";

function statusClass(status: string) {
  if (status === "accepted") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "countered") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default async function AdminOffersPage() {
  await connectDB();

  const offers = await Offer.find({}).sort({ createdAt: -1 }).lean();

  const carIds = offers.map((o: any) => o.carId).filter(Boolean);
  const cars = carIds.length
    ? await Car.find({ _id: { $in: carIds } })
        .select("year make model trim price slug")
        .lean()
    : [];

  const carById = new Map(cars.map((c: any) => [c._id.toString(), c]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Offers</h1>
        <p className="mt-1 text-gray-500">
          Buyer offers submitted on vehicle listings.
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <HandCoins className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No offers yet</h2>
          <p className="mt-2 text-gray-500">
            Offers submitted by customers on a vehicle will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer: any) => {
            const car: any = carById.get(offer.carId?.toString());
            const carTitle = car
              ? `${car.year} ${car.make} ${car.model} ${car.trim || ""}`.trim()
              : "Vehicle unavailable";

            return (
              <div
                key={offer._id.toString()}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black uppercase ${statusClass(
                        offer.status
                      )}`}
                    >
                      {offer.status}
                    </span>

                    {car ? (
                      <Link
                        href={`/admin/edit-car/${car._id}`}
                        className="mt-2 block font-bold text-gray-900 hover:text-red-600"
                      >
                        {carTitle}
                      </Link>
                    ) : (
                      <p className="mt-2 font-bold text-gray-500">{carTitle}</p>
                    )}

                    <p className="mt-1 text-sm text-gray-500">
                      {offer.buyerName} &middot; {offer.buyerPhone}
                      {offer.buyerEmail ? ` · ${offer.buyerEmail}` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Offer Amount
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                      ${Number(offer.amount || 0).toLocaleString()}
                    </p>
                    {offer.counterAmount ? (
                      <p className="text-sm font-semibold text-amber-600">
                        Countered: ${Number(offer.counterAmount).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <OfferActions
                    offerId={offer._id.toString()}
                    status={offer.status}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
