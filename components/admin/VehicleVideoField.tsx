"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { parseVideoUrl } from "@/lib/videoUrl";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function VehicleVideoField({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = (value || "").trim();
  const source = trimmed ? parseVideoUrl(trimmed) : null;
  const showInvalid = trimmed.length > 0 && !source;

  async function handleFile(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setUploadError("Please select a video file.");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("resourceType", "video");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success || !data.images?.[0]?.url) {
        throw new Error(data.error || "Video upload failed");
      }

      onChange(data.images[0].url);
    } catch (err: any) {
      setUploadError(err.message || "Video upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="vehicle-video-url" className="text-sm font-bold text-gray-700">
          Vehicle Video
        </label>
        {trimmed && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Remove Video
          </button>
        )}
      </div>

      <input
        id="vehicle-video-url"
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste a YouTube, Vimeo, Cloudinary, or direct MP4 URL"
        className="w-full rounded-xl border p-3"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
          )}
          {uploading ? "Uploading…" : "Upload Video File"}
        </button>
        <span className="text-xs text-gray-400">or paste a link above</span>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && (
        <p className="mt-2 text-sm font-semibold text-red-600">{uploadError}</p>
      )}

      {showInvalid && (
        <p className="mt-2 text-sm font-semibold text-amber-600">
          This doesn&apos;t look like a supported video link (YouTube, Vimeo,
          Cloudinary, or a direct MP4/WebM file).
        </p>
      )}

      {source && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Preview
          </p>
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <VideoPlayer source={source} title="Vehicle video preview" />
          </div>
        </div>
      )}
    </div>
  );
}
