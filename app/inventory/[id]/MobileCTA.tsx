"use client";

export default function MobileCTA({
  price,
}: {
  price: number;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 shadow-xl lg:hidden">

      {/* URGENCY BAR */}
      <div className="text-center text-xs text-red-600 font-semibold mb-2">
        🔥 High Demand – This vehicle may sell soon
      </div>

      <div className="flex items-center justify-between gap-3">

        {/* PRICE */}
        <div>
          <p className="text-xs text-gray-500">Price</p>
          <p className="text-lg font-extrabold text-red-600">
            ${price.toLocaleString()}
          </p>

          {/* EXTRA TRUST */}
          <p className="text-[11px] text-gray-400">
            No hidden fees
          </p>
        </div>

        {/* CTA BUTTONS */}
        <div className="flex gap-2">

          <a
            href="/financing"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
          >
            Get Approved
          </a>

          <a
          href="tel:+19162618880"
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
          >
            Call
          </a>

        </div>
      </div>
    </div>
  );
}