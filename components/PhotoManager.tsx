"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadCloud, X, RotateCcw, Star, Trash2, GripVertical } from "lucide-react";

type Img = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

type Props = {
  value: Img[];
  onChange: (images: Img[]) => void;
};

type PendingUpload = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "error" | "done";
  error?: string;
};

function proThumb(url: string) {
  return url.replace("/upload/", "/upload/c_fill,w_500,h_350,q_auto,f_auto/");
}

function normalizeCover(images: Img[]) {
  if (images.length === 0) return images;

  const hasCover = images.some((img) => img.isCover);
  if (!hasCover) {
    return images.map((img, i) => ({
      ...img,
      isCover: i === 0,
    }));
  }

  return images;
}

function SortablePhoto({
  img,
  index,
  onCover,
  onDelete,
}: {
  img: Img;
  index: number;
  onCover: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: img.url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      <img
        src={proThumb(img.url)}
        alt={`Vehicle photo ${index + 1}`}
        className="h-36 w-full object-cover sm:h-40"
      />

      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 flex h-8 w-8 cursor-grab touch-none items-center justify-center rounded-full bg-black/70 text-white active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
        #{index + 1}
      </div>

      {img.isCover && (
        <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
          <Star className="h-3 w-3 fill-black" aria-hidden="true" />
          Cover
        </div>
      )}

      <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        {!img.isCover && (
          <button
            type="button"
            onClick={onCover}
            className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow"
          >
            Set Cover
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function uploadFile(
  file: File,
  onProgress: (pct: number) => void
): Promise<{ url: string; publicId?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("files", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.success) {
          const image = data.images?.[0];
          if (image?.url) {
            resolve({ url: image.url, publicId: image.publicId });
            return;
          }
        }
        reject(new Error(data.error || "Upload failed"));
      } catch {
        reject(new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

export default function PhotoManager({ value, onChange }: Props) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function startUpload(entry: PendingUpload) {
    setPending((prev) =>
      prev.map((p) =>
        p.id === entry.id ? { ...p, status: "uploading", progress: 0, error: undefined } : p
      )
    );

    uploadFile(entry.file, (pct) => {
      setPending((prev) =>
        prev.map((p) => (p.id === entry.id ? { ...p, progress: pct } : p))
      );
    })
      .then(({ url, publicId }) => {
        const next = normalizeCover([
          ...valueRef.current,
          { url, publicId, isCover: valueRef.current.length === 0 },
        ]);
        onChange(next);

        setPending((prev) => prev.filter((p) => p.id !== entry.id));
        URL.revokeObjectURL(entry.previewUrl);
      })
      .catch((err: Error) => {
        setPending((prev) =>
          prev.map((p) =>
            p.id === entry.id
              ? { ...p, status: "error", error: err.message || "Upload failed" }
              : p
          )
        );
      });
  }

  function handleFiles(files: FileList | File[] | null) {
    if (!files) return;

    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    const entries: PendingUpload[] = list.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    setPending((prev) => [...prev, ...entries]);
    entries.forEach(startUpload);
  }

  function retry(id: string) {
    const entry = pending.find((p) => p.id === id);
    if (entry) startUpload(entry);
  }

  function cancelPending(id: string) {
    setPending((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
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
    onChange(normalizeCover(updated));
    setDeleteIndex(null);
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((img) => img.url === active.id);
    const newIndex = value.findIndex((img) => img.url === over.id);

    const updated = arrayMove(value, oldIndex, newIndex);
    onChange(normalizeCover(updated));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
          isDragOver
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-gray-400" aria-hidden="true" />
        <p className="font-semibold text-gray-700">
          Drag &amp; drop photos here, or tap to choose
        </p>
        <p className="text-xs text-gray-500">
          You can select multiple photos from your phone or computer.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {pending.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pending.map((entry) => (
            <div
              key={entry.id}
              className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <img
                src={entry.previewUrl}
                alt="Uploading preview"
                className="h-36 w-full object-cover opacity-80 sm:h-40"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 p-3 text-center text-white">
                {entry.status === "uploading" && (
                  <>
                    <p className="text-xs font-bold">Uploading… {entry.progress}%</p>
                    <div className="h-1.5 w-full max-w-[80%] overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  </>
                )}

                {entry.status === "error" && (
                  <>
                    <p className="text-xs font-bold text-red-300">
                      {entry.error || "Upload failed"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => retry(entry.id)}
                        className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelPending(entry.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && pending.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-gray-500">
          No photos yet. Upload vehicle photos above.
        </div>
      ) : value.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map((img) => img.url)}
            strategy={rectSortingStrategy}
          >
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {value.map((img, index) => (
                <SortablePhoto
                  key={img.url}
                  img={img}
                  index={index}
                  onCover={() => setCover(index)}
                  onDelete={() => setDeleteIndex(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : null}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-black">Delete photo?</h3>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              This photo will be removed from this vehicle gallery.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteIndex(null)}
                className="flex-1 rounded-xl border px-4 py-3 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => remove(deleteIndex)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
