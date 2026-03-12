import Link from "next/link";

export default function FinancingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Car Financing Made Easy
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Get approved fast. All credit types welcome. No pressure, no hassle.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/inventory"
              className="rounded-xl bg-white text-black px-8 py-4 font-semibold"
            >
              Browse Inventory
            </Link>

            <Link
              href="/sell-your-car"
              className="rounded-xl border border-white px-8 py-4 font-semibold"
            >
              Get Pre-Approved
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border p-6 text-center">
            <h3 className="text-xl font-bold mb-2">All Credit Types</h3>
            <p className="text-gray-600 text-sm">
              Bad credit, no credit, or rebuilding — we’ve got you covered.
            </p>
          </div>

          <div className="rounded-2xl border p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Fast Approval</h3>
            <p className="text-gray-600 text-sm">
              Apply online and get a response within minutes.
            </p>
          </div>

          <div className="rounded-2xl border p-6 text-center">
            <h3 className="text-xl font-bold mb-2">Best Rates</h3>
            <p className="text-gray-600 text-sm">
              We work with trusted lenders to secure competitive rates.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>

          <p className="text-gray-600 mb-8">
            Tell us about your vehicle or browse our inventory today.
          </p>

          <Link
            href="/sell-your-car"
            className="inline-block rounded-xl bg-black text-white px-10 py-4 text-lg"
          >
            Start Financing Now
          </Link>
        </div>
      </section>
    </div>
  );
}
