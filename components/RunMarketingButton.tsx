"use client";

export default function RunMarketingButton({ carId }: { carId: string }) {
  async function runMarketing() {
    const res = await fetch("/api/admin/cars/run-marketing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ carId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Marketing run failed");
      return;
    }

    const text = `
CRAIGSLIST
${data.craigslist.title}

${data.craigslist.description}

OFFERUP
${data.offerup.title}

${data.offerup.description}

MARKETPLACE
${data.marketplace.title}

PRICE:
${data.marketplace.price}

${data.marketplace.description}
`.trim();

    await navigator.clipboard.writeText(text);

    alert("Marketing engine completed. Drafts copied to clipboard.");
  }

  return (
    <button
      onClick={runMarketing}
      className="rounded bg-indigo-600 px-3 py-1.5 text-xs text-white"
    >
      Run Marketing
    </button>
  );
}