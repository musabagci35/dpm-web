"use client";

import { useState } from "react";
import { proThumb } from "@/lib/cloudinaryImage";

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

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
  
    const uploadedImages: Img[] = [];
  
    for (const file of Array.from(files)) {
      const reader = new FileReader();
  
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
  
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file: base64 }),
      });
  
      const result = await res.json();
  
      if (!res.ok || !result.success) {
        alert(result.error || "Image upload failed");
        continue;
      }
  
      uploadedImages.push({
        url: result.url,
        publicId: result.publicId,
        isCover: value.length === 0 && uploadedImages.length === 0,
      });
    }
  
    onChange([...value, ...uploadedImages]);
  }

  function setCover(index: number) {
    const updated = value.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));

    onChange(updated);
  }

  function remove(index: number) {
    const updated = value.filter((_, i) => i !== index);

    if (updated.length > 0 && !updated.some((img) => img.isCover)) {
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
    <>
      <div className="mb-3">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {value.map((img, index) => (
          <div
            key={`${img.url}-${index}`}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            className="relative border rounded-xl overflow-hidden group"
          >
            <img
             src={proThumb(img.url)}
              alt={`Vehicle photo ${index + 1}`}
              className="w-full h-32 object-cover"
            />

            {img.isCover && (
              <div className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-1 rounded">
                COVER
              </div>
            )}

            <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                type="button"
                onClick={() => setCover(index)}
                className="flex-1 bg-white text-xs px-2 py-1 rounded"
              >
                Cover
              </button>

              <button
                type="button"
                onClick={() => remove(index)}
                className="flex-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
