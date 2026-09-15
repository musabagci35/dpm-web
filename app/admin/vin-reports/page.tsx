export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { FileSearch, ExternalLink } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import VinHistory from "@/models/VinHistory";
import Car from "@/models/Car";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminVinReportsPage({ searchParams }: Props) {
  await connectDB();

  const params = (await searchParams) || {};
  const query = (params.q || "").trim().toUpperCase();

  const filter = query ? { vin: { $regex: query, $options: "i" } } : {};

  const history = await VinHistory.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const vins = history.map((h: any) => h.vin).filter(Boolean);

  const matchedCars = vins.length
    ? await Car.find({ vin: { $in: vins } })
        .select("vin slug status")
        .lean()
    : [];

  const carByVin = new Map(matchedCars.map((c: any) => [c.vin, c]));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">VIN Reports</h1>
          <p className="text-gray-500">
            History of VIN lookups performed while importing inventory.
          </p>
        </div>

        <a
          href="/vin-report"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 font-bold text-white hover:bg-zinc-800"
        >
          Run New VIN Check
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <form className="mb-6 flex gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        <input
          type="text"
          name="q"
          defaultValue={params.q || ""}
          placeholder="Search by VIN"
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
        >
          Search
        </button>
      </form>

      {history.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <FileSearch className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">No VIN lookups found</h2>
          <p className="mt-2 text-gray-500">
            VIN lookups are logged automatically when a vehicle is imported by VIN.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">VIN</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Decoded</th>
                  <th className="px-4 py-3">Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((h: any) => {
                  const car: any = carByVin.get(h.vin);

                  return (
                    <tr key={h._id.toString()}>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">
                        {h.vin}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {h.year} {h.make} {h.model}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {car ? (
                          <Link
                            href={`/admin/edit-car/${car._id}`}
                            className="font-semibold text-red-600 hover:text-red-700"
                          >
                            View Vehicle ({car.status})
                          </Link>
                        ) : (
                          <span className="text-gray-400">Not in inventory</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
