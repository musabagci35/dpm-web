"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Facebook,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Wrench,
} from "lucide-react";

type MarketingInfo = {
  facebookPosted: boolean;
  facebookLastPublishedAt: string | null;
  facebookLastError: string;
  craigslistReady: boolean;
  craigslistLastCopiedAt: string | null;
  offerupReady: boolean;
  offerupLastCopiedAt: string | null;
};

type Vehicle = {
  id: string;
  slug: string;
  title: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  description: string;
  status: string;
  image: string;
  images: string[];
  marketing: MarketingInfo;
};

type Connections = {
  facebook: boolean;
  craigslist: boolean;
  offerup: boolean;
  ebayParts: boolean;
  ebayVehicles: boolean;
};

type ChannelStat = { publishedCount: number; lastPublishedAt: string | null };
type ChannelStats = {
  facebook: ChannelStat;
  craigslist: ChannelStat;
  offerup: ChannelStat;
  ebay: ChannelStat;
};

type Preview = {
  title: string;
  description: string;
  facebook: string;
  craigslist: string;
  offerup: string;
};

type ActionState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

type ChannelKey = "facebook" | "craigslist" | "offerup" | "ebay";

const DEALER_CONTACT = [
  "Drive Prime Motors LLC",
  "Sacramento / Rancho Cordova, CA",
  "(916) 261-8880",
].join("\n");

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(value: number) {
  if (!value || value <= 0) return "Call for Price";
  return `$${value.toLocaleString()}`;
}

function buildManualListingText(vehicle: Vehicle, previewText: string) {
  const lines = [
    vehicle.title,
    formatPrice(vehicle.price),
    vehicle.mileage
      ? `${vehicle.mileage.toLocaleString()} miles`
      : "Mileage available on request",
    "",
    vehicle.description || previewText || "Dealer-inspected and ready to drive.",
    "",
    "Contact:",
    DEALER_CONTACT,
  ];

  if (vehicle.images.length > 0) {
    lines.push("", "Photos:", ...vehicle.images);
  }

  return lines.join("\n");
}

function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MarketingCenterClient({
  vehicles,
  connections,
  channelStats,
  initialCarId,
}: {
  vehicles: Vehicle[];
  connections: Connections;
  channelStats: ChannelStats;
  initialCarId: string | null;
}) {
  const marketable = useMemo(
    () => vehicles.filter((v) => v.status !== "sold"),
    [vehicles]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    initialCarId && vehicles.some((v) => v.id === initialCarId)
      ? initialCarId
      : marketable[0]?.id || null
  );

  const [selectedChannel, setSelectedChannel] = useState<ChannelKey>("facebook");

  const [marketingById, setMarketingById] = useState<Record<string, MarketingInfo>>(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v.marketing]))
  );

  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [facebookState, setFacebookState] = useState<ActionState>({ status: "idle" });
  const [craigslistState, setCraigslistState] = useState<ActionState>({ status: "idle" });
  const [offerupState, setOfferupState] = useState<ActionState>({ status: "idle" });

  const selected = vehicles.find((v) => v.id === selectedId) || null;
  const selectedMarketing = selected ? marketingById[selected.id] : null;

  function selectVehicle(id: string) {
    setSelectedId(id);
    setPreview(null);
    setFacebookState({ status: "idle" });
    setCraigslistState({ status: "idle" });
    setOfferupState({ status: "idle" });
  }

  async function generatePreview() {
    if (!selected) return;
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/listing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ car: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate preview");
      setPreview(data);
    } catch (err: any) {
      alert(err.message || "Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function publishFacebook() {
    if (!selected) return;

    if (!connections.facebook) {
      setFacebookState({
        status: "error",
        message: "Facebook is not connected. See setup instructions above.",
      });
      return;
    }

    setFacebookState({ status: "loading" });

    try {
      const res = await fetch("/api/admin/cars/post-facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: selected.id }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setFacebookState({ status: "error", message: data.error || "Publish failed" });
        setMarketingById((prev) => ({
          ...prev,
          [selected.id]: {
            ...prev[selected.id],
            facebookLastError: data.error || "Publish failed",
          },
        }));
        return;
      }

      setFacebookState({ status: "success", message: "Published to Facebook" });
      setMarketingById((prev) => ({
        ...prev,
        [selected.id]: {
          ...prev[selected.id],
          facebookPosted: true,
          facebookLastPublishedAt: new Date().toISOString(),
          facebookLastError: "",
        },
      }));
    } catch {
      setFacebookState({ status: "error", message: "Network error" });
    }
  }

  async function markCopied(channel: "craigslist" | "offerup") {
    if (!selected || !selectedMarketing) return;

    const setState = channel === "craigslist" ? setCraigslistState : setOfferupState;
    const text = buildManualListingText(selected, preview?.[channel] || "");

    setState({ status: "loading" });

    try {
      await navigator.clipboard.writeText(text);

      const now = new Date().toISOString();
      const readyField = channel === "craigslist" ? "craigslistReady" : "offerupReady";
      const timeField =
        channel === "craigslist" ? "craigslistLastCopiedAt" : "offerupLastCopiedAt";

      const nextMarketing = {
        ...selectedMarketing,
        [readyField]: true,
        [timeField]: now,
      };

      const res = await fetch(`/api/admin/cars/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing: nextMarketing }),
      });

      if (!res.ok) throw new Error("Failed to save status");

      setMarketingById((prev) => ({ ...prev, [selected.id]: nextMarketing }));
      setState({
        status: "success",
        message: "Copied to clipboard — post it manually to finish.",
      });
    } catch {
      setState({ status: "error", message: "Could not copy listing text" });
    }
  }

  function exportListing(channel: "craigslist" | "offerup") {
    if (!selected) return;
    const text = buildManualListingText(selected, preview?.[channel] || "");
    const safeName = selected.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadTextFile(text, `${safeName || "listing"}-${channel}.txt`);
  }

  function openPostingPage(channel: "craigslist" | "offerup") {
    const url =
      channel === "craigslist" ? "https://post.craigslist.org/" : "https://offerup.com/post";
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const channelTabs: { key: ChannelKey; label: string }[] = [
    { key: "facebook", label: "Facebook" },
    { key: "craigslist", label: "Craigslist" },
    { key: "offerup", label: "OfferUp" },
    { key: "ebay", label: "eBay" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Marketing Center</h1>
        <p className="mt-1 text-gray-500">
          Distribute vehicle listings to Facebook, Craigslist, OfferUp, and eBay.
        </p>
      </div>

      {/* CHANNEL CONNECTIONS */}
      <div className="mb-8">
        <SectionLabel>Channel Connections</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FacebookConnectionCard
            connected={connections.facebook}
            stats={channelStats.facebook}
          />
          <ManualChannelConnectionCard
            name="Craigslist"
            stats={channelStats.craigslist}
            supports="Generates ready-to-post listing text — no public posting API exists, so posting is manual on craigslist.org."
          />
          <ManualChannelConnectionCard
            name="OfferUp"
            stats={channelStats.offerup}
            supports="Generates ready-to-post listing text — no public posting API exists, so posting is manual on offerup.com."
          />
          <EbayConnectionCard
            partsConnected={connections.ebayParts}
            stats={channelStats.ebay}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* VEHICLE PICKER */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-bold text-gray-700">1. Select a Vehicle</p>
          <div className="max-h-[600px] space-y-2 overflow-y-auto">
            {marketable.length === 0 && (
              <p className="p-3 text-sm text-gray-500">No marketable vehicles.</p>
            )}
            {marketable.map((v) => {
              const m = marketingById[v.id];
              const active = v.id === selectedId;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => selectVehicle(v.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                    active ? "border-red-600 bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  <img
                    src={v.image || "/car.png"}
                    alt={v.title}
                    className="h-12 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-gray-900">
                      {v.title}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {formatPrice(v.price)}
                    </span>
                    <span className="mt-1 flex gap-1">
                      {m?.facebookPosted && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                          FB
                        </span>
                      )}
                      {m?.craigslistReady && (
                        <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                          CL
                        </span>
                      )}
                      {m?.offerupReady && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                          OU
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WORKFLOW */}
        <div className="space-y-6">
          {!selected ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
              Select a vehicle to get started.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-gray-700">2. Select a Channel</p>
                <div className="flex flex-wrap gap-2">
                  {channelTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedChannel(tab.key)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        selectedChannel === tab.key
                          ? "bg-black text-white"
                          : "border text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedChannel !== "ebay" ? (
                <>
                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="mb-3 text-sm font-bold text-gray-700">
                      3. Preview the Listing
                    </p>
                    <p className="mb-4 text-sm text-gray-500">
                      {selected.title} &middot; {formatPrice(selected.price)}
                    </p>

                    <button
                      type="button"
                      onClick={generatePreview}
                      disabled={previewLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {previewLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {previewLoading ? "Generating…" : "Generate Listing Preview"}
                    </button>
                  </div>

                  {preview && selectedChannel === "facebook" && (
                    <ChannelWorkflowCard
                      label="Facebook"
                      icon={<Facebook className="h-5 w-5" aria-hidden="true" />}
                      text={preview.facebook}
                      connected={connections.facebook}
                      actionState={facebookState}
                      lastActivity={selectedMarketing?.facebookLastPublishedAt || null}
                      lastError={selectedMarketing?.facebookLastError || ""}
                      primaryLabel="Publish to Facebook"
                      onPrimary={publishFacebook}
                      retryLabel="Retry Publish"
                    />
                  )}

                  {preview && selectedChannel === "craigslist" && (
                    <ManualChannelWorkflowCard
                      label="Craigslist"
                      text={buildManualListingText(selected, preview.craigslist)}
                      actionState={craigslistState}
                      lastActivity={selectedMarketing?.craigslistLastCopiedAt || null}
                      onCopy={() => markCopied("craigslist")}
                      onExport={() => exportListing("craigslist")}
                      onOpen={() => openPostingPage("craigslist")}
                    />
                  )}

                  {preview && selectedChannel === "offerup" && (
                    <ManualChannelWorkflowCard
                      label="OfferUp"
                      text={buildManualListingText(selected, preview.offerup)}
                      actionState={offerupState}
                      lastActivity={selectedMarketing?.offerupLastCopiedAt || null}
                      onCopy={() => markCopied("offerup")}
                      onExport={() => exportListing("offerup")}
                      onOpen={() => openPostingPage("offerup")}
                    />
                  )}
                </>
              ) : (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    <h3 className="font-black text-gray-900">eBay</h3>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    Parts listings available; vehicle publishing not connected.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    There is no eBay integration for vehicle listings in this
                    application. The existing eBay integration only supports
                    Parts inventory.
                  </p>
                  <Link
                    href="/admin/parts"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800"
                  >
                    Manage Parts Listings
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
      {children}
    </p>
  );
}

function StatusBadge({
  variant,
  label,
}: {
  variant: "connected" | "not-connected";
  label: string;
}) {
  return variant === "connected" ? (
    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function FacebookConnectionCard({
  connected,
  stats,
}: {
  connected: boolean;
  stats: ChannelStat;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900">Facebook</h3>
        <StatusBadge
          variant={connected ? "connected" : "not-connected"}
          label={connected ? "Connected" : "Not connected — setup required"}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Publishes vehicle photos and details directly to your Facebook Page
        via the Graph API.
      </p>

      <p className="mt-3 text-2xl font-black text-gray-900">{stats.publishedCount}</p>
      <p className="text-xs text-gray-500">Listings published</p>
      <p className="mt-2 text-xs text-gray-500">
        Last activity: {formatDate(stats.lastPublishedAt)}
      </p>

      {connected ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          Configured via server credentials. Publishing is available below.
        </p>
      ) : (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-bold">Setup instructions</p>
          <p className="mt-1">
            No Facebook connection has been configured. There is no in-app
            OAuth flow yet, so publishing must be enabled by an administrator
            by setting <code className="font-mono">FACEBOOK_PAGE_ID</code> and{" "}
            <code className="font-mono">FACEBOOK_PAGE_TOKEN</code> as server
            environment variables (e.g. in your hosting provider&apos;s
            settings), using a Page Access Token from Meta&apos;s developer
            portal.
          </p>
        </div>
      )}
    </div>
  );
}

function ManualChannelConnectionCard({
  name,
  stats,
  supports,
}: {
  name: string;
  stats: ChannelStat;
  supports: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900">{name}</h3>
        <StatusBadge variant="not-connected" label="Not connected — manual posting" />
      </div>

      <p className="mt-2 text-xs text-gray-500">{supports}</p>

      <p className="mt-3 text-2xl font-black text-gray-900">{stats.publishedCount}</p>
      <p className="text-xs text-gray-500">Listings copied</p>
      <p className="mt-2 text-xs text-gray-500">
        Last activity: {formatDate(stats.lastPublishedAt)}
      </p>

      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <p className="font-bold">Safe fallback</p>
        <p className="mt-1">
          {name} has no public posting API. Use the Copy Listing or Export
          Listing actions in the workflow below, then paste the listing on{" "}
          {name}&apos;s own site.
        </p>
      </div>
    </div>
  );
}

function EbayConnectionCard({
  partsConnected,
  stats,
}: {
  partsConnected: boolean;
  stats: ChannelStat;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900">eBay</h3>
        <StatusBadge
          variant={partsConnected ? "connected" : "not-connected"}
          label={partsConnected ? "Parts: Connected" : "Parts: Not connected"}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Parts listings publish to eBay via the existing Trading API
        integration. Vehicle listings are not supported.
      </p>

      <p className="mt-3 text-2xl font-black text-gray-900">{stats.publishedCount}</p>
      <p className="text-xs text-gray-500">Parts currently listed on eBay</p>

      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
        <p className="font-bold">Vehicles: Not connected</p>
        <p className="mt-1">
          There is no eBay integration for vehicle listings in this
          application.
        </p>
      </div>

      <Link
        href="/admin/parts"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
      >
        Manage Parts Listings
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ChannelWorkflowCard({
  label,
  icon,
  text,
  connected,
  actionState,
  lastActivity,
  lastError,
  primaryLabel,
  retryLabel,
  onPrimary,
}: {
  label: string;
  icon?: React.ReactNode;
  text: string;
  connected: boolean;
  actionState: ActionState;
  lastActivity: string | null;
  lastError?: string;
  primaryLabel: string;
  retryLabel?: string;
  onPrimary: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-bold text-gray-700">
        4. Connect or Publish &middot; 5. Result
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-black text-gray-900">{label}</h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {!connected && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-600">
              Not connected
            </span>
          )}
          <span>Last activity: {formatDate(lastActivity)}</span>
        </div>
      </div>

      <textarea
        readOnly
        value={text}
        className="min-h-[120px] w-full rounded-xl border bg-gray-50 p-3 text-sm"
      />

      {lastError && (
        <p className="mt-2 text-sm font-semibold text-red-600">Last error: {lastError}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(text)}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Text
        </button>

        {connected ? (
          <button
            type="button"
            onClick={onPrimary}
            disabled={actionState.status === "loading"}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {actionState.status === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {actionState.status === "error" && retryLabel ? retryLabel : primaryLabel}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold text-gray-400">
            Not connected — see setup instructions above
          </span>
        )}
      </div>

      {actionState.status === "success" && (
        <p className="mt-2 text-sm font-semibold text-green-600">
          {actionState.message || "Done"}
        </p>
      )}
      {actionState.status === "error" && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          {actionState.message || "Something went wrong"}
        </p>
      )}
    </div>
  );
}

function ManualChannelWorkflowCard({
  label,
  text,
  actionState,
  lastActivity,
  onCopy,
  onExport,
  onOpen,
}: {
  label: string;
  text: string;
  actionState: ActionState;
  lastActivity: string | null;
  onCopy: () => void;
  onExport: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-bold text-gray-700">
        4. Copy / Export &middot; 5. Result
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-black text-gray-900">{label}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-bold text-gray-600">
            Not connected — manual posting
          </span>
          <span>Last activity: {formatDate(lastActivity)}</span>
        </div>
      </div>

      <p className="mb-2 text-xs text-gray-500">
        Includes title, price, mileage, description, contact information, and
        photo links.
      </p>

      <textarea
        readOnly
        value={text}
        className="min-h-[200px] w-full rounded-xl border bg-gray-50 p-3 font-mono text-xs"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          disabled={actionState.status === "loading"}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {actionState.status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Listing
        </button>

        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export Listing
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Open {label}
        </button>
      </div>

      {actionState.status === "success" && (
        <p className="mt-2 text-sm font-semibold text-green-600">
          {actionState.message || "Done"}
        </p>
      )}
      {actionState.status === "error" && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          {actionState.message || "Something went wrong"}
        </p>
      )}
    </div>
  );
}
