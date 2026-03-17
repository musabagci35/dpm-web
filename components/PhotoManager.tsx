"use client";

import { useState } from "react";

type Img = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

type Props = {
  value: Img[];
  onChange: (imgs: Img[]) => void;
};

export default function PhotoManager({ value, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function setCover(index: number) {
    const updated = value.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    onChange(updated);
  }

  function remove(index: number) {
    const updated = value.filter((_, i) => i !== index);

    // cover yoksa ilkini cover yap
    if (updated.length > 0 && !updated.some((i) => i.isCover)) {
      updated[0].isCover = true;
    }

    onChange(updated);
  }

  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDrop(index: number) {
    if (dragIndex === null) return;

    const copy = [...value];
    const dragged = copy[dragIndex];

    copy.splice(dragIndex, 1);
    copy.splice(index, 0, dragged);

    setDragIndex(null);
    onChange(copy);
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {value.map((img, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => onDrop(index)}
          className="relative border rounded-xl overflow-hidden group"
        >
          <img src={img.url} className="w-full h-32 object-cover" />

          {/* COVER */}
          {img.isCover && (
            <div className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-1 rounded">
              COVER
            </div>
          )}

          {/* ACTIONS */}
          <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setCover(index)}
              className="flex-1 bg-white text-xs px-2 py-1 rounded"
            >
              Cover
            </button>

            <button
              onClick={() => remove(index)}
              className="flex-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}