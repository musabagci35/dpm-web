"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  images?: string[];
};

export default function Gallery({ images }: Props) {
  const safeImages =
    images && images.length > 0 ? images : ["/car.png"];

  const [active, setActive] = useState<string>(safeImages[0]);

  // Eğer images değişirse active image reset
  useEffect(() => {
    setActive(safeImages[0]);
  }, [images]);

  return (
    <div className="space-y-4">

      {/* MAIN IMAGE */}
      <div className="relative w-full h-[450px] overflow-hidden rounded-xl bg-gray-100">
        <Image
          src={active}
          alt="Vehicle image"
          fill
          sizes="(max-width:768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* THUMBNAILS */}
      <div className="flex gap-3 overflow-x-auto">

        {safeImages.map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(img)}
            className={`relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border ${
              active === img ? "border-black" : "border-gray-200"
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${index}`}
              fill
              sizes="120px"
              className="object-cover"
            />
          </button>
        ))}

      </div>

    </div>
  );
}