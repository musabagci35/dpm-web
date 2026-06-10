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

  const active =
    safeImages.length > 0 ? safeImages[current] : "/car-placeholder.png";

  const prev = () => {
    setCurrent((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const next = () => {
    setCurrent((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">

      {/* MAIN IMAGE */}
      <div className="relative w-full h-[450px] overflow-hidden rounded-2xl bg-gray-100 group">

        <Image
          src={active}
          alt="Vehicle image"
          fill
          sizes="100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />

        {/* LEFT ARROW */}
        {safeImages.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ←
          </button>
        )}

        {/* RIGHT ARROW */}
        {safeImages.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            →
          </button>
        )}

        {/* IMAGE COUNT */}
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {current + 1} / {safeImages.length}
        </div>
      </div>

      {/* THUMBNAILS */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`relative w-[90px] h-[70px] rounded-lg overflow-hidden border transition ${
                current === index
                  ? "border-black scale-105"
                  : "border-gray-300 hover:scale-105"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index}`}
                fill
                sizes="90px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}