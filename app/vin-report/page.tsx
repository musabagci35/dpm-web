import Link from "next/link";

export default function VinReportPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f9]">

      {/* HERO */}
      <section className="bg-[linear-gradient(90deg,#05070d,#0b1f4a,#05070d)] text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">

          <div className="max-w-3xl">

            <div className="inline-block mb-4 px-4 py-1 text-sm rounded-full bg-white/10">
              Drive Prime Motors • Sacramento
            </div>

            <h1 className="text-[52px] font-extrabold">
              Free VIN Report
            </h1>

            <h2 className="text-[48px] font-extrabold text-red-500 mt-2">
              Fast. Clean. Trusted.
            </h2>

            <p className="mt-6 text-white/70 text-lg">
              Check accident history, title status, salvage records, and auction traces in seconds.
            </p>

          </div>

        </div>
      </section>

      {/* FORM */}
      <section className="max-w-7xl mx-auto px-6 py-16">

        <form
          action="/vin-report/result"
          method="GET"
          className="bg-white p-8 rounded-2xl border flex gap-4"
        >
          <input
            name="vin"
            placeholder="Enter VIN (17 characters)"
            className="flex-1 h-[52px] border rounded-xl px-4"
          />

          <button
            type="submit"
            className="bg-black text-white px-6 rounded-xl"
          >
            Check Now
          </button>
        </form>

      </section>

    </main>
  );
}