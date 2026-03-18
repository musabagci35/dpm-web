"use client";

import { useState } from "react";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { validateImageFile } from "@/lib/validateImageFile";

type UploadedImage = {
  secure_url: string;
  public_id: string;
};

export default function ImageUploader({
  onUploaded,
}: {
  onUploaded: (image: UploadedImage) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      validateImageFile(file);
      const result = await uploadToCloudinary(file);

      onUploaded({
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
      {uploading && <p className="text-sm">Uploading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}