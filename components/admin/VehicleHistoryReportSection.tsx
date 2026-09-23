"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { uploadRawToCloudinary } from "@/lib/uploadToCloudinary";

const REPORT_FOLDER = "drive-prime-motors/vehicle-history-reports";
const MAX_REPORT_BYTES = 25 * 1024 * 1024;

export type VehicleHistoryReportSource = "carfax" | "seller_provided" | "other";

export type VehicleHistoryReportValue =
  | {
      url?: string;
      source?: string;
      reportDate?: string | null;
    }
  | null
  | undefined;

export type VehicleHistoryReportInput = {
  url: string;
  source: VehicleHistoryReportSource;
  reportDate: string | null;
};

type Props = {
  value: VehicleHistoryReportValue;
  onChange: (next: VehicleHistoryReportInput) => void;
};

function reportFileName(url: string) {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || "Uploaded report");
  } catch {
    return "Uploaded report";
  }
}

/**
 * Admin-only section for attaching a real, verified vehicle history report
 * (typically a CARFAX PDF). Never generates, infers, or calls any CARFAX
 * API — every value here is either a file the admin uploaded or a URL/date
 * they typed in themselves. Shared by the Add Vehicle and Edit Vehicle
 * pages; the parent owns the actual save (this only reports value changes).
 */
export default function VehicleHistoryReportSection({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const url = value?.url || "";
  // The schema's own default ("other") is just an empty placeholder, not an
  // admin choice — until a report is actually attached, CARFAX is the
  // default shown here, per spec. Once a report exists, respect whatever
  // source the admin picked.
  const source: VehicleHistoryReportSource =
    url && (value?.source === "seller_provided" || value?.source === "other")
      ? value.source
      : "carfax";
  const reportDate = value?.reportDate ? value.reportDate.slice(0, 10) : "";

  function update(patch: Partial<VehicleHistoryReportInput>) {
    onChange({
      url,
      source,
      reportDate: reportDate || null,
      ...patch,
    });
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploadError("");

    const looksLikePdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!looksLikePdf) {
      setUploadError("Please select a PDF file.");
      return;
    }

    if (file.size > MAX_REPORT_BYTES) {
      setUploadError("That file is larger than 25 MB.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadRawToCloudinary(file, REPORT_FOLDER);
      update({ url: uploaded.secure_url });
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    setUploadError("");
    onChange({ url: "", source: "carfax", reportDate: null });
  }

  return (
    <div className="rounded-2xl border bg-gray-50 p-5">
      <h2 className="text-xl font-black">CARFAX / Vehicle History</h2>
      <p className="mt-1 text-sm text-gray-500">
        Attach a real, verified report (a CARFAX PDF, or another vehicle
        history report). Nothing here is generated automatically.
      </p>

      {url ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 font-semibold text-blue-700 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{reportFileName(url)}</span>
          </a>

          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1 self-start rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 sm:self-auto"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Remove Report
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No report uploaded yet.</p>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mt-3 inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
        )}
        {uploading ? "Uploading…" : url ? "Replace PDF" : "Upload CARFAX PDF"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] || null);
          e.target.value = "";
        }}
      />

      {uploadError && (
        <p className="mt-2 text-sm font-semibold text-red-600">{uploadError}</p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Report Source
          </span>
          <select
            value={source}
            onChange={(e) => update({ source: e.target.value as VehicleHistoryReportSource })}
            className="w-full rounded-xl border bg-white p-3"
          >
            <option value="carfax">CARFAX</option>
            <option value="seller_provided">Seller Provided</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Report Date (optional)
          </span>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => update({ reportDate: e.target.value || null })}
            className="w-full rounded-xl border bg-white p-3"
          />
        </label>
      </div>
    </div>
  );
}
