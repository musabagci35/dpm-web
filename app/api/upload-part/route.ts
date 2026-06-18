import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const file = body.file;

    if (!file || typeof file !== "string") {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    if (!file.startsWith("data:image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    const uploaded = await cloudinary.uploader.upload(file, {
      folder: "driveprimemotors/parts",
      resource_type: "image",
      overwrite: false,
      unique_filename: true,
    });

    return NextResponse.json({
      success: true,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    console.error("Part upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}