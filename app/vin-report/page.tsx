"use client";

import { useState } from "react";

export default function VinReportPage() {
  const [vin, setVin] = useState("");

  const quickLinks = [
    {
      label: "Bidfax Photos",
      href: vin ? `https://bidfax.info/?q=${vin}` : "https://bidfax.info",
    },
    {
      label: "Stat.vin Records",
      href: vin ? `https://stat.vin/search?vin=${vin}` : "https://stat.vin",
    },
    {
      label: "Poctra Search",
      href: vin ? `https://poctra.com/search?query=${vin}` : "https://poctra.com",
    },
    {
      label: "Copart Search",
      href: vin ? `https://www.copart.com/lotSearchResults?free=true&query=${vin}` : "https://www.copart.com",
    },
  ];

  const handleRun = () => {
    if (!vin.trim()) {
      alert("Please enter a VIN first.");
      return;
    }

    window.open(`/vin-report/result?vin=${encodeURIComponent(vin)}`, "_self");
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#111827]">
      {/* HERO */}
      <section className="border-b bg-gradient-to-b from-[#081225] to-[#0d1b3a] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
              Drive Prime Motors • Sacramento
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Free VIN Report
              <span className="block text-red-500">Fast. Clean. Trusted.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base text-white/80 md:text-lg">
              Check accident history, title status, salvage records, and auction
              traces in seconds. Built for serious buyers who want cleaner deals
              and fewer surprises.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/75">
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                ✔ No signup required
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                ✔ Instant VIN lookup
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2">
                ✔ Local dealer trusted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CARD */}
      <section className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold md:text-3xl">
                Check Vehicle History
              </h2>
              <p className="mt-2 text-sm text-gray-500 md:text-base">
                Enter a 17-character VIN to start your report.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
                placeholder="Enter VIN (17 characters)"
                className="h-14 flex-1 rounded-2xl border px-4 text-base outline-none transition focus:border-black"
              />

              <button
                onClick={handleRun}
                className="h-14 rounded-2xl bg-black px-6 text-base font-semibold text-white transition hover:opacity-90"
              >
                Check Now
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Common VIN example: <span className="font-medium">1FA6P8TH0G5231070</span>
            </div>

            {/* TRUST BOXES */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-lg font-semibold">Accident History</div>
                <p className="mt-1 text-sm text-gray-500">
                  Spot prior damage and insurance events faster.
                </p>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-lg font-semibold">Title Status</div>
                <p className="mt-1 text-sm text-gray-500">
                  Check salvage, rebuilt, and clean title clues.
                </p>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-lg font-semibold">Auction Trace</div>
                <p className="mt-1 text-sm text-gray-500">
                  Search public auction records and photo history.
                </p>
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="mt-8">
              <h3 className="mb-3 text-lg font-semibold">Quick Search Sources</h3>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border px-4 py-4 text-sm font-medium transition hover:bg-black hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Why buyers use this</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                <li>• Avoid hidden salvage surprises</li>
                <li>• Check prior auction history</li>
                <li>• Buy with more confidence</li>
                <li>• Save time before calling sellers</li>
              </ul>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Need help buying?</h3>
              <p className="mt-2 text-sm text-gray-600">
                Our team can help review vehicles, compare pricing, and guide you
                toward cleaner inventory.
              </p>

              <div className="mt-5 space-y-3">
                <a
                  href="/inventory"
                  className="block rounded-2xl bg-red-600 px-4 py-3 text-center font-semibold text-white transition hover:opacity-90"
                >
                  Browse Inventory
                </a>

                <a
                  href="/financing"
                  className="block rounded-2xl border px-4 py-3 text-center font-semibold transition hover:bg-gray-50"
                >
                  Apply for Financing
                </a>
              </div>
            </div>

            <div className="rounded-3xl border bg-[#0f172a] p-6 text-white shadow-sm">
              <h3 className="text-xl font-bold">Drive Prime Motors</h3>
              <p className="mt-2 text-sm text-white/75">
                Sacramento, California
              </p>
              <p className="mt-1 text-sm text-white/75">(916) 261-8880</p>
              <p className="mt-4 text-sm text-white/75">
                Transparent pricing. Fast approvals. Cleaner deals.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}