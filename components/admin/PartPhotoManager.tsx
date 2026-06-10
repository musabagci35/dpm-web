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

export default function PartPhotoManager({ value, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
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
    } catch (error) {
      console.error(error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    const updated = value.filter((_, i) => i !== index);

    if (updated.length > 0 && !updated.some((img) => img.isCover)) {
      updated[0].isCover = true;
    }

    onChange(updated);
  }

  function setCover(index: number) {
    const updated = value.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));

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
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        disabled={uploading}
        onChange={(e) => handleUpload(e.target.files)}
        className="mb-2 w-full rounded border p-2"
      />

      {uploading && (
        <p className="mb-4 text-sm text-gray-500">Uploading images...</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {value.map((img, index) => (
          <div
            key={`${img.url}-${index}`}
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            className="relative overflow-hidden rounded-xl border bg-white"
          >
            <img
              src={img.url}
              alt={`Part image ${index + 1}`}
              className="h-40 w-full object-cover"
            />

            {img.isCover && (
              <div className="absolute left-2 top-2 rounded bg-black px-2 py-1 text-xs font-bold text-white">
                COVER
              </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCover(index)}
                className="flex-1 rounded bg-white px-2 py-1 text-xs"
              >
                Cover
              </button>

              <button
                type="button"
                onClick={() => remove(index)}
                className="flex-1 rounded bg-red-600 px-2 py-1 text-xs text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}