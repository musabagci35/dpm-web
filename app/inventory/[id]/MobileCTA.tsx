"use client";

export default function MobileCTA({
  price,
}: {
  price: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 shadow-lg lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-lg font-extrabold text-red-600">
            ${price.toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/financing"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Get Approved
          </a>

          <a
            href="tel:+19162769090"
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Call
          </a>
        </div>
      </div>
    </div>
  );
}