"use client";

import { useEffect, useState } from "react";

type Lot = any;

export default function AuctionCenterPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    auction: "copart",
    lotNumber: "",
    vin: "",
    year: "",
    make: "",
    model: "",
    titleStatus: "unknown",
    damageType: "",
    currentBid: "",
    buyNowPrice: "",
    auctionFees: "",
    transportCost: "",
    repairEstimate: "",
    otherCost: "",
    targetRetailPrice: "",
    maxBid: "",
    auctionUrl: "",
    notes: "",
    runAndDrive: false,
    hasKeys: false,
  });

  async function loadLots() {
    const res = await fetch("/api/admin/auction", { cache: "no-store" });
    const data = await res.json();
    setLots(data.lots || []);
  }

  useEffect(() => {
    loadLots();
  }, []);

  function update(name: string, value: any) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed");
        return;
      }

      alert("Auction lot added");
      setForm({
        auction: "copart",
        lotNumber: "",
        vin: "",
        year: "",
        make: "",
        model: "",
        titleStatus: "unknown",
        damageType: "",
        currentBid: "",
        buyNowPrice: "",
        auctionFees: "",
        transportCost: "",
        repairEstimate: "",
        otherCost: "",
        targetRetailPrice: "",
        maxBid: "",
        auctionUrl: "",
        notes: "",
        runAndDrive: false,
        hasKeys: false,
      });

      loadLots();
    } finally {
      setLoading(false);
    }
  }

  const totalActive = lots.filter((l) => l.decision !== "pass").length;

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-600">
              Drive Prime Motors
            </p>
            <h1 className="text-4xl font-black">Auction Center</h1>
            <p className="mt-2 text-gray-500">
              Copart, Manheim, IAAI and auction profit tracking.
            </p>
          </div>

          <div className="rounded-2xl bg-black px-5 py-4 text-white">
            <p className="text-xs text-white/60">Active Watchlist</p>
            <p className="text-2xl font-black">{totalActive}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <form onSubmit={submit} className="h-fit rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">Add Auction Lot</h2>

            <div className="mt-5 grid gap-3">
              <select
                value={form.auction}
                onChange={(e) => update("auction", e.target.value)}
                className="rounded-2xl border px-4 py-3"
              >
                <option value="copart">Copart</option>
                <option value="manheim">Manheim</option>
                <option value="iaai">IAAI</option>
                <option value="adesa">Adesa</option>
                <option value="acv">ACV</option>
                <option value="other">Other</option>
              </select>

              <input placeholder="Lot Number" value={form.lotNumber} onChange={(e) => update("lotNumber", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="VIN" value={form.vin} onChange={(e) => update("vin", e.target.value.toUpperCase())} className="rounded-2xl border px-4 py-3 uppercase" />

              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Year" value={form.year} onChange={(e) => update("year", e.target.value)} className="rounded-2xl border px-4 py-3" />
                <input placeholder="Make" value={form.make} onChange={(e) => update("make", e.target.value)} className="rounded-2xl border px-4 py-3" />
                <input placeholder="Model" value={form.model} onChange={(e) => update("model", e.target.value)} className="rounded-2xl border px-4 py-3" />
              </div>

              <input placeholder="Title Status" value={form.titleStatus} onChange={(e) => update("titleStatus", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Damage Type" value={form.damageType} onChange={(e) => update("damageType", e.target.value)} className="rounded-2xl border px-4 py-3" />

              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl border px-4 py-3">
                  <input type="checkbox" checked={form.runAndDrive} onChange={(e) => update("runAndDrive", e.target.checked)} /> Run & Drive
                </label>
                <label className="rounded-2xl border px-4 py-3">
                  <input type="checkbox" checked={form.hasKeys} onChange={(e) => update("hasKeys", e.target.checked)} /> Keys
                </label>
              </div>

              <input placeholder="Current Bid" value={form.currentBid} onChange={(e) => update("currentBid", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Buy Now Price" value={form.buyNowPrice} onChange={(e) => update("buyNowPrice", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Auction Fees" value={form.auctionFees} onChange={(e) => update("auctionFees", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Transport Cost" value={form.transportCost} onChange={(e) => update("transportCost", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Repair Estimate" value={form.repairEstimate} onChange={(e) => update("repairEstimate", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Other Cost" value={form.otherCost} onChange={(e) => update("otherCost", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Target Retail Price" value={form.targetRetailPrice} onChange={(e) => update("targetRetailPrice", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Max Bid" value={form.maxBid} onChange={(e) => update("maxBid", e.target.value)} className="rounded-2xl border px-4 py-3" />
              <input placeholder="Auction URL" value={form.auctionUrl} onChange={(e) => update("auctionUrl", e.target.value)} className="rounded-2xl border px-4 py-3" />

              <textarea placeholder="Notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} className="rounded-2xl border px-4 py-3" />

              <button disabled={loading} className="rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-red-700">
                {loading ? "Adding..." : "Add Lot"}
              </button>
            </div>
          </form>

          <section className="grid gap-5">
            {lots.length === 0 && (
              <div className="rounded-3xl border bg-white p-10 text-center text-gray-500">
                No auction lots yet.
              </div>
            )}

            {lots.map((lot) => (
              <div key={lot._id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                      {lot.auction} {lot.lotNumber ? `• Lot ${lot.lotNumber}` : ""}
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                      {lot.year || ""} {lot.make || ""} {lot.model || ""}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{lot.vin || "No VIN"}</p>
                  </div>

                  <DecisionBadge decision={lot.decision} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <Info label="Bid / Buy" value={`$${Number(lot.buyNowPrice || lot.currentBid || 0).toLocaleString()}`} />
                  <Info label="Total Cost" value={`$${Number(lot.totalCost || 0).toLocaleString()}`} />
                  <Info label="Retail" value={`$${Number(lot.targetRetailPrice || 0).toLocaleString()}`} />
                  <Info label="Profit" value={`$${Number(lot.estimatedProfit || 0).toLocaleString()}`} />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <Info label="Title" value={lot.titleStatus || "Unknown"} />
                  <Info label="Damage" value={lot.damageType || "N/A"} />
                  <Info label="Run & Drive" value={lot.runAndDrive ? "Yes" : "No"} />
                  <Info label="Keys" value={lot.hasKeys ? "Yes" : "No"} />
                </div>

                {lot.auctionUrl && (
                  <a
                    href={lot.auctionUrl}
                    target="_blank"
                    className="mt-5 inline-block rounded-2xl bg-black px-5 py-3 font-black text-white hover:bg-red-600"
                  >
                    Open Auction
                  </a>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-black uppercase text-gray-400">{label}</p>
      <p className="mt-1 font-black text-gray-900">{value}</p>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const cls =
    decision === "bid"
      ? "bg-green-100 text-green-700"
      : decision === "pass"
      ? "bg-red-100 text-red-700"
      : decision === "purchased"
      ? "bg-blue-100 text-blue-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`rounded-full px-4 py-2 text-sm font-black uppercase ${cls}`}>
      {decision}
    </span>
  );
}
