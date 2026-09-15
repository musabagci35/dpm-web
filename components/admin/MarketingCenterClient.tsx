"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Facebook,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Loader2,
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
  marketing: MarketingInfo;
};

type Connections = {
  facebook: boolean;
  craigslist: boolean;
  offerup: boolean;
  ebay: boolean;
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
    const text = preview?.[channel];

    if (!text) {
      alert("Generate the listing preview first.");
      return;
    }

    const setState = channel === "craigslist" ? setCraigslistState : setOfferupState;
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

      const postUrl =
        channel === "craigslist" ? "https://post.craigslist.org/" : "https://offerup.com/post";
      window.open(postUrl, "_blank", "noopener,noreferrer");
    } catch {
      setState({ status: "error", message: "Could not copy listing text" });
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Marketing Center</h1>
        <p className="mt-1 text-gray-500">
          Distribute vehicle listings to Facebook, Craigslist, and OfferUp.
        </p>
      </div>

      {/* CHANNEL OVERVIEW */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelCard
          name="Facebook"
          connected={connections.facebook}
          stats={channelStats.facebook}
        />
        <ChannelCard
          name="Craigslist"
          connected={connections.craigslist}
          stats={channelStats.craigslist}
          manual
        />
        <ChannelCard
          name="OfferUp"
          connected={connections.offerup}
          stats={channelStats.offerup}
          manual
        />
        <ChannelCard
          name="eBay"
          connected={connections.ebay}
          stats={channelStats.ebay}
          note={
            <Link href="/admin/parts" className="underline hover:text-red-600">
              Available for Parts listings
            </Link>
          }
        />
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
                <p className="mb-3 text-sm font-bold text-gray-700">
                  2. Generate &amp; Preview Listing
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

              {preview && (
                <>
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

                  <ChannelWorkflowCard
                    label="Craigslist"
                    text={preview.craigslist}
                    connected={false}
                    manual
                    actionState={craigslistState}
                    lastActivity={selectedMarketing?.craigslistLastCopiedAt || null}
                    primaryLabel="Copy Listing & Open Craigslist"
                    onPrimary={() => markCopied("craigslist")}
                  />

                  <ChannelWorkflowCard
                    label="OfferUp"
                    text={preview.offerup}
                    connected={false}
                    manual
                    actionState={offerupState}
                    lastActivity={selectedMarketing?.offerupLastCopiedAt || null}
                    primaryLabel="Copy Listing & Open OfferUp"
                    onPrimary={() => markCopied("offerup")}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  name,
  connected,
  stats,
  manual = false,
  note,
}: {
  name: string;
  connected: boolean;
  stats: ChannelStat;
  manual?: boolean;
  note?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900">{name}</h3>
        {connected ? (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Not connected
          </span>
        )}
      </div>

      <p className="mt-3 text-2xl font-black text-gray-900">{stats.publishedCount}</p>
      <p className="text-xs text-gray-500">
        {manual ? "Listings copied" : "Listings published"}
      </p>

      <p className="mt-3 text-xs text-gray-500">
        Last activity: {formatDate(stats.lastPublishedAt)}
      </p>

      {note && <p className="mt-2 text-xs text-gray-500">{note}</p>}
    </div>
  );
}

function ChannelWorkflowCard({
  label,
  icon,
  text,
  connected,
  manual = false,
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
  manual?: boolean;
  actionState: ActionState;
  lastActivity: string | null;
  lastError?: string;
  primaryLabel: string;
  retryLabel?: string;
  onPrimary: () => void;
}) {
  const canPublish = manual || connected;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-black text-gray-900">{label}</h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {!manual && !connected && (
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

        {canPublish ? (
          <button
            type="button"
            onClick={onPrimary}
            disabled={actionState.status === "loading"}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {actionState.status === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {manual && <ExternalLink className="h-4 w-4" aria-hidden="true" />}
            {actionState.status === "error" && retryLabel ? retryLabel : primaryLabel}
          </button>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-dashed px-4 py-2.5 text-sm font-semibold text-gray-400">
            Connect {label} to publish
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
