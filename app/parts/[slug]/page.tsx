import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import Part from "@/models/Part";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PartDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  await connectDB();

  const part: any = await Part.findOne({
    slug,
  }).lean();

  if (!part) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Link
        href="/parts"
        className="mb-6 inline-block text-sm font-semibold text-gray-600 hover:underline"
      >
        ← Back to Parts
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border bg-gray-100">
          {part.images?.[0]?.url ? (
            <img
              src={part.images[0].url}
              alt={part.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-96 items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase text-white">
              {part.condition || "used"}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase text-gray-700">
              {part.category || "other"}
            </span>

            {Number(part.quantity || 0) <= 0 ? (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                Sold Out
              </span>
            ) : Number(part.quantity || 0) <= 2 ? (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                Low Stock
              </span>
            ) : (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                In Stock
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold">
            {part.title}
          </h1>

          <div className="mt-4 text-3xl font-extrabold text-red-600">
            $
            {Number(part.price || 0).toLocaleString()}
            <p className="mt-2 text-sm text-green-600 font-semibold">
  Fast Shipping Available
</p>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border p-5 text-sm">
            <p>
              <strong>SKU:</strong>{" "}
              {part.sku || "N/A"}
            </p>

            <p>
              <strong>Part Number:</strong>{" "}
              {part.partNumber || "N/A"}
            </p>

            <p>
              <strong>OEM Number:</strong>{" "}
              {part.oemNumber || "N/A"}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {part.category || "other"}
            </p>

            <p>
              <strong>Compatibility:</strong>{" "}
              {part.compatibility || "N/A"}
            </p>

            <p>
              <strong>Quantity:</strong>{" "}
              {part.quantity || 0}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border p-5">
            <h2 className="mb-2 text-xl font-bold">
              Description
            </h2>

            <p className="whitespace-pre-line text-gray-700">
              {part.description ||
                "No description available."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="tel:+19162618880"
              className="rounded-xl bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
            >
              Call About This Part
            </a>

            <a
              href={`mailto:driveprimemotors@gmail.com?subject=Question about ${encodeURIComponent(
                part.title
              )}`}
              className="rounded-xl border px-6 py-3 font-bold hover:bg-gray-50"
            >
              Email Us
            </a>
            {part.ebayUrl && (
  <a
    href={part.ebayUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
  >
    Buy on eBay
  </a>
)}
          </div>
        </div>
      </div>
    </main>
  );
}