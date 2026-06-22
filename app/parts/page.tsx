import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { proThumb } from "@/lib/cloudinaryImage";
import Part from "@/models/Part";

export default async function PartsPage() {
  await connectDB();

  const parts: any[] = await Part.find({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Used Auto Parts For Sale</h1>
        <p className="mt-2 text-gray-500">
          Quality used, new, and rebuilt auto parts
        </p>
      </div>

      {parts.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center text-gray-500">
          No parts available yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {parts.map((part: any) => (
            <Link
              key={part._id.toString()}
              href={`/parts/${part.slug}`}
              className="overflow-hidden rounded-2xl border bg-white transition hover:shadow-xl"
            >
              <div className="flex aspect-video items-center justify-center bg-gray-100">
                {part.images?.[0]?.url ? (
                  <img
                  src={proThumb(part.images[0].url)}
                    alt={part.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold uppercase text-gray-700">
                    {part.category || "other"}
                  </span>

                  {Number(part.quantity || 0) <= 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                      Sold Out
                    </span>
                  ) : Number(part.quantity || 0) <= 2 ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-bold text-yellow-700">
                      Low Stock
                    </span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                      In Stock
                    </span>
                  )}
                </div>

                <div className="mt-3 line-clamp-2 text-lg font-semibold">
                  {part.title}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Part #: {part.partNumber || "N/A"} | OEM:{" "}
                  {part.oemNumber || "N/A"}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  {part.compatibility || "Compatibility not listed"}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {part.price
                      ? `$${Number(part.price).toLocaleString()}`
                      : "Call For Price"}
                  </div>

                  <div className="rounded bg-black px-2 py-1 text-xs uppercase text-white">
                    {part.condition || "used"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}