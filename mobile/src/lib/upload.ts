import { CloudinarySignature } from "./api";

export type PickedPhoto = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type UploadedPhoto = { url: string; publicId: string };

/**
 * Uploads directly to Cloudinary using a short-lived signature from
 * /api/admin/cloudinary-sign — the same signed-upload pattern the web admin
 * uses (lib/uploadToCloudinary.ts), adapted for React Native's FormData/XHR.
 * XMLHttpRequest is used instead of fetch so upload progress is observable.
 */
export function uploadPhotoToCloudinary(
  photo: PickedPhoto,
  signature: CloudinarySignature,
  onProgress?: (percent: number) => void
): Promise<UploadedPhoto> {
  return new Promise((resolve, reject) => {
    const name = photo.fileName || `vehicle-${Date.now()}.jpg`;
    const type = photo.mimeType || "image/jpeg";

    const form = new FormData();
    // React Native's FormData accepts this {uri, name, type} descriptor in
    // place of a real File/Blob.
    form.append("file", { uri: photo.uri, name, type } as unknown as Blob);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`
    );

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
        reject(new Error(data?.error?.message || "Photo upload failed."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Photo upload failed. Check your connection."));
    };

    xhr.send(form);
  });
}
