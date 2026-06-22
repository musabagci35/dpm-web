"use client";

import { useState } from "react";
import { proThumb, proImage } from "@/lib/cloudinaryImage";

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
  const [preview, setPreview] = useState<string | null>(null);

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

        const res = await fetch("/api/upload-part", {
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
    onChange(value.map((img, i) => ({ ...img, isCover: i === index })));
  }

  function rotate(index: number) {
    const updated = [...value];
    const img = updated[index];

    if (!img.url.includes("res.cloudinary.com")) {
      alert("Only Cloudinary images can be rotated.");
      return;
    }

    let rotatedUrl = img.url;

    if (rotatedUrl.includes("/upload/a_270/")) {
      rotatedUrl = rotatedUrl.replace("/upload/a_270/", "/upload/");
    } else if (rotatedUrl.includes("/upload/a_180/")) {
      rotatedUrl = rotatedUrl.replace("/upload/a_180/", "/upload/a_270/");
    } else if (rotatedUrl.includes("/upload/a_90/")) {
      rotatedUrl = rotatedUrl.replace("/upload/a_90/", "/upload/a_180/");
    } else {
      rotatedUrl = rotatedUrl.replace("/upload/", "/upload/a_90/");
    }

    updated[index] = { ...img, url: rotatedUrl };
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
            className="group relative overflow-hidden rounded-xl border bg-white"
          >
            <img
              src={proThumb(img.url)}
              alt={`Part image ${index + 1}`}
              onClick={() => setPreview(img.url)}
              className="h-40 w-full cursor-pointer object-cover"
            />

            {img.isCover && (
              <div className="absolute left-2 top-2 rounded bg-black px-2 py-1 text-xs font-bold text-white">
                COVER
              </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setCover(index)}
                className="flex-1 rounded bg-white px-2 py-1 text-xs"
              >
                Cover
              </button>

              <button
                type="button"
                onClick={() => rotate(index)}
                className="flex-1 rounded bg-gray-900 px-2 py-1 text-xs text-white"
              >
                Rotate
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

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 rounded bg-white px-4 py-2 text-black"
          >
            Close
          </button>

          <img
            src={proImage(preview)}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}