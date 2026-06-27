"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuctionImageUpload({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;

    setLoading(true);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadRes.json();
    const urls = uploadData.images?.map((img: any) => img.url) || [];

    if (urls.length > 0) {
      await fetch("/api/auction/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vehicleId, images: urls }),
      });
    }

    setLoading(false);
    setDragging(false);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-black">Auction Photos</h2>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          uploadFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center ${
          dragging ? "border-red-600 bg-red-50" : "border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className="text-xl font-black">
          {loading ? "Uploading..." : "Drag & Drop Photos Here"}
        </span>

        <span className="mt-2 text-sm text-gray-500">
          or click to select multiple photos
        </span>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="hidden"
        />
      </label>
    </div>
  );
}
