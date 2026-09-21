import Link from "next/link";

export default function VinReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-red-950 px-6 py-24 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-600 blur-3xl" />
          <div className="absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-red-100">
              Drive Prime Motors • Sacramento
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Free Basic VIN Check
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">
              Decode any 17-character VIN using the official NHTSA vPIC
              database — year, make, model, trim, engine, and more, at no
              cost.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                Manufacturer Specs
              </span>
              <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                Safety Recall Check
              </span>
              <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                Powered by NHTSA vPIC
              </span>
              <span className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                Dealer Support
              </span>
            </div>

            <p className="mt-6 max-w-2xl text-sm text-white/60">
              This is a basic manufacturer VIN decode, not a complete vehicle
              history report. It does not check accidents, title, ownership,
              odometer, or service history.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-6 text-gray-900">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600">
                VIN Lookup
              </p>

              <h3 className="mt-2 text-3xl font-black">
                Enter Your VIN
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your VIN is 17 characters and can usually be found on the
                windshield, driver door sticker, title, or registration.
              </p>

              <form
                action="/vin-report/result"
                method="GET"
                className="mt-6 grid gap-3"
              >
                <input
                  name="vin"
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="h-14 rounded-2xl border px-4 font-bold uppercase outline-none focus:border-red-600"
                />

                <button
                  type="submit"
                  className="h-14 rounded-2xl bg-red-600 px-6 font-black text-white shadow-lg shadow-red-900/30 hover:bg-red-700"
                >
                  Check VIN Now
                </button>
              </form>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                Need help? Call{" "}
                <a href="tel:+19162618880" className="font-black text-red-600">
                  (916) 261-8880
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl font-black text-red-700">
            1
          </div>
          <h3 className="text-xl font-black">Enter VIN</h3>
          <p className="mt-3 text-gray-600">
            Type or paste the vehicle VIN and start the check instantly.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl font-black text-red-700">
            2
          </div>
          <h3 className="text-xl font-black">Review Details</h3>
          <p className="mt-3 text-gray-600">
            See manufacturer specs decoded directly from the VIN, plus any
            open safety recalls.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl font-black text-red-700">
            3
          </div>
          <h3 className="text-xl font-black">Buy With Confidence</h3>
          <p className="mt-3 text-gray-600">
            Use this alongside a full vehicle history report before buying,
            trading, or listing your vehicle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-black">What This Check Does &amp; Does Not Cover</h2>
          <p className="mt-2 leading-7">
            This free tool decodes manufacturer information from the VIN
            using the official NHTSA vPIC database and checks for open NHTSA
            safety recalls. It is <strong>not</strong> a Carfax or AutoCheck
            report, and it does not show accident history, prior ownership,
            service records, title brands, or odometer readings. For a
            complete history, use a dedicated vehicle history provider.
          </p>
        </div>
      </section>

      <section className="bg-black px-6 py-16 text-center text-white">
        <h2 className="text-4xl font-black">
          Looking for a Reliable Used Vehicle?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/70">
          Browse Drive Prime Motors inventory or contact us for financing and
          trade-in support.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/inventory"
            className="rounded-2xl bg-red-600 px-7 py-4 font-black text-white hover:bg-red-700"
          >
            Browse Inventory
          </Link>

          <Link
            href="/sell-your-car"
            className="rounded-2xl border border-white/20 px-7 py-4 font-black text-white hover:bg-white hover:text-black"
          >
            Sell Your Car
          </Link>
        </div>
      </section>
    </div>
  );
}
