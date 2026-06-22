"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: { url: string }[];
};

export default function Gallery({ images }: Props) {
  const safeImages = (images || [])
    .map((img) => img?.url)
    .filter((url) => typeof url === "string" && url.trim() !== "");

  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <div className="grid gap-2 lg:grid-cols-[1fr_120px]">
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

        <div className="hidden grid-rows-5 gap-2 lg:grid">
          {safeImages.slice(0, 5).map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={`relative overflow-hidden bg-gray-100 ${
                current === index ? "ring-4 ring-red-700" : ""
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
        </div>
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {safeImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border ${
                current === index ? "border-red-700" : "border-gray-300"
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