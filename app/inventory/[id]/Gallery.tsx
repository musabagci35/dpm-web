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

  return (
    <div className="space-y-4">
      {/* MAIN IMAGE */}
      <div className="relative w-full h-[450px] overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={active}
          alt="Vehicle image"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* THUMBNAILS */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {safeImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`relative w-[90px] h-[70px] rounded overflow-hidden border ${
                current === index ? "border-black" : "border-gray-300"
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