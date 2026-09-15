"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Play, ArrowLeft } from "lucide-react";
import { parseVideoUrl } from "@/lib/videoUrl";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  images: { url: string }[];
  videoUrl?: string;
  videoPoster?: string;
};

export default function Gallery({ images, videoUrl, videoPoster }: Props) {
  const safeImages = (images || [])
    .map((img) => img?.url)
    .filter((url) => typeof url === "string" && url.trim() !== "");

  const videoSource = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);
  const poster = videoPoster || safeImages[0] || "/car-placeholder.png";

  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"photos" | "video">("photos");

  const active =
    safeImages.length > 0 ? safeImages[current] : "/car-placeholder.png";

  const prev = () => {
    if (safeImages.length <= 1) return;
    setCurrent((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const next = () => {
    if (safeImages.length <= 1) return;
    setCurrent((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  function showPhoto(index: number) {
    setMode("photos");
    setCurrent(index);
  }

  const sideRowCount = Math.min(safeImages.length, 5) + (videoSource ? 1 : 0);

  return (
    <>
      <div className="grid gap-2 lg:grid-cols-[1fr_120px]">
        {mode === "video" && videoSource ? (
          <div className="relative h-[520px] overflow-hidden bg-black">
            <VideoPlayer source={videoSource} poster={poster} />
            <button
              type="button"
              onClick={() => setMode("photos")}
              className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-black shadow hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Photos
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative h-[520px] overflow-hidden bg-gray-100 text-left"
          >
            <Image
              src={active}
              alt="Vehicle image"
              fill
              sizes="900px"
              className="object-cover"
            />

            <div className="absolute bottom-4 right-4 rounded-full bg-black/80 px-4 py-2 text-sm font-bold text-white">
              View Photos {current + 1}/{safeImages.length}
            </div>
          </button>
        )}

        <div
          className="hidden gap-2 lg:grid"
          style={{ gridTemplateRows: `repeat(${sideRowCount || 1}, 1fr)` }}
        >
          {safeImages.slice(0, 5).map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => showPhoto(index)}
              className={`relative overflow-hidden bg-gray-100 ${
                mode === "photos" && current === index ? "ring-4 ring-red-700" : ""
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />

              {index === 4 && safeImages.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-bold text-white">
                  +{safeImages.length - 5}
                </div>
              )}
            </button>
          ))}

          {videoSource && (
            <button
              type="button"
              onClick={() => setMode("video")}
              aria-label="Watch vehicle video"
              className={`group relative overflow-hidden bg-gray-100 ${
                mode === "video" ? "ring-4 ring-red-700" : ""
              }`}
            >
              <Image
                src={poster}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/50" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black">
                  <Play className="ml-0.5 h-4 w-4 fill-black" aria-hidden="true" />
                </span>
              </span>
              <span className="absolute left-1 top-1 rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                Video
              </span>
            </button>
          )}
        </div>
      </div>

      {(safeImages.length > 1 || videoSource) && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {safeImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => showPhoto(index)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border ${
                mode === "photos" && current === index
                  ? "border-red-700"
                  : "border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}

          {videoSource && (
            <button
              type="button"
              onClick={() => setMode("video")}
              aria-label="Watch vehicle video"
              className={`group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border ${
                mode === "video" ? "border-red-700" : "border-gray-300"
              }`}
            >
              <Image
                src={poster}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/50" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-black" aria-hidden="true" />
                </span>
              </span>
              <span className="absolute left-1 top-1 rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                Video
              </span>
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 z-50 rounded-full bg-white px-4 py-2 font-bold text-black"
          >
            Close
          </button>

          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-5 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/90 px-4 py-3 text-2xl font-bold"
            >
              ←
            </button>
          )}

          <div className="relative mx-auto h-full max-w-6xl">
            <Image
              src={active}
              alt="Vehicle large image"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-5 top-1/2 z-50 -translate-y-1/2 rounded-full bg-white/90 px-4 py-3 text-2xl font-bold"
            >
              →
            </button>
          )}

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black">
            {current + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </>
  );
}
