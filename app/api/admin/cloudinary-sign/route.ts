import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json().catch(() => ({}));
    const folder =
      typeof body.folder === "string" && body.folder.trim()
        ? body.folder.trim()
        : process.env.CLOUDINARY_UPLOAD_FOLDER || "drive-prime-motors";

    // "raw" is for non-image/video files (e.g. a CARFAX PDF) — Cloudinary
    // stores them as-is instead of trying to process them as an image.
    const resourceType = body.resourceType === "raw" ? "raw" : "image";

    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      timestamp,
      folder,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      resourceType,
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}