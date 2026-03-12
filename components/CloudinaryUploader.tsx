"use client";

import { useState } from "react";

type Uploaded = { url: string; publicId?: string };

export default function CloudinaryUploader({
  onUploaded,
}: {
  onUploaded: (files: Uploaded[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setBusy(true);
    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign?.error || "Sign failed");

      const uploaded: Uploaded[] = [];

      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("signature", sign.signature);
        form.append("folder", sign.folder);

        const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });

        const up = await upRes.json();
        if (!upRes.ok) throw new Error(up?.error?.message || "Upload failed");

        uploaded.push({ url: up.secure_url, publicId: up.public_id });
      }

      onUploaded(uploaded);
    } catch (e: any) {
      alert(e?.message || "Upload error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold">Photos</div>

      <div className="mt-3 flex items-center gap-3">
        <input
          type="file"
          multiple
          accept="image/*"
          disabled={busy}
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {busy && <span className="text-sm text-gray-600">Uploading...</span>}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Upload images here. They’ll be saved to the vehicle when you click Save.
      </p>
    </div>
  );
}