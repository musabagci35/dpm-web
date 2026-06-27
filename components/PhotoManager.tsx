"use client";

import { useState } from "react";
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

type Img = {
  url: string;
  publicId?: string;
  isCover?: boolean;
};

type Props = {
  value: Img[];
  onChange: (images: Img[]) => void;
};

function proThumb(url: string) {
  return url.replace("/upload/", "/upload/c_fill,w_500,h_350,q_auto,f_auto/");
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
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <img
          src={proThumb(img.url)}
          alt={`Vehicle photo ${index + 1}`}
          className="h-36 w-full object-cover"
        />
      </div>

      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">
        #{index + 1}
      </div>

      {img.isCover && (
        <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-black">
          👑 Cover
        </div>
      )}

      <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onCover}
          className="flex-1 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow"
        >
          Set Cover
        </button>

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

export default function PhotoManager({ value, onChange }: Props) {
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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

  if (!value || value.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
        No photos yet. Upload vehicle photos below.
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={value.map((img) => img.url)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-black">Delete photo?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This photo will be removed from this vehicle gallery.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteIndex(null)}
                className="flex-1 rounded-xl border px-4 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => remove(deleteIndex)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}