import { MarketplaceCloudinarySignature } from "./marketplaceApi";

export type PickedVideo = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  durationMs?: number | null;
};

export type UploadedVideo = { url: string; publicId: string };

/**
 * Same signed-upload pattern as lib/upload.ts (photos), but posts to
 * Cloudinary's /video/upload endpoint instead of /image/upload — the
 * signature (folder + timestamp) is identical either way, since resource
 * type isn't part of what Cloudinary signs.
 */
export function uploadVideoToCloudinary(
  video: PickedVideo,
  signature: MarketplaceCloudinarySignature,
  onProgress?: (percent: number) => void
): Promise<UploadedVideo> {
  return new Promise((resolve, reject) => {
    const name = video.fileName || `listing-video-${Date.now()}.mov`;
    const type = video.mimeType || "video/quicktime";

    const form = new FormData();
    form.append("file", { uri: video.uri, name, type } as unknown as Blob);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);
    // Cloudinary transcodes to a widely-compatible format server-side, which
    // is the "compress when possible" step for anything the picker's own
    // export preset didn't already shrink.
    form.append("eager", "q_auto:good");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // fall through to the status check below
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve({ url: data.secure_url, publicId: data.public_id || "" });
      } else {
        reject(new Error(data?.error?.message || "Video upload failed."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Video upload failed. Check your connection."));
    };

    xhr.send(form);
  });
}
