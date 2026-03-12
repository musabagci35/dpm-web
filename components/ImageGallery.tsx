"use client";

import { useState } from "react";

export default function ImageGallery({ images }: { images: string[] }) {

  const [current,setCurrent] = useState(0)

  if(!images || images.length === 0){
    return (
      <img
        src="/car.png"
        className="w-full h-[420px] object-cover rounded-xl"
      />
    )
  }

  return (

    <div>

      {/* MAIN IMAGE */}

      <img
        src={images[current]}
        className="w-full h-[420px] object-cover rounded-xl"
      />

      {/* THUMBNAILS */}

      <div className="flex gap-2 mt-3 overflow-x-auto">

        {images.map((img,i)=>(
          <img
            key={i}
            src={img}
            onClick={()=>setCurrent(i)}
            className={`h-20 w-28 object-cover rounded cursor-pointer border ${
              i === current ? "border-black" : "border-gray-200"
            }`}
          />
        ))}

      </div>

    </div>

  )

}