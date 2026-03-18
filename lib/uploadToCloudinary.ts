export async function uploadToCloudinary(file: File) {
    const signRes = await fetch("/api/admin/cloudinary-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "drive-prime-motors/cars" }),
    });
  
    if (!signRes.ok) {
      throw new Error("Could not get upload signature");
    }
  
    const { timestamp, folder, signature, cloudName, apiKey } =
      await signRes.json();
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", folder);
  
    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
  
    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(err || "Upload failed");
    }
  
    return uploadRes.json();
  }