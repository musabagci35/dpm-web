import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (!body.file) {
        return NextResponse.json(
          { success: false, error: "No file" },
          { status: 400 }
        );
      }

      const uploaded = await cloudinary.uploader.upload(body.file, {
        folder: "driveprimemotors/vehicles",
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
      });

      return NextResponse.json({
        success: true,
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files" },
        { status: 400 }
      );
    }

    const uploadedImages = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "driveprimemotors/vehicles",
              resource_type: "image",
              overwrite: false,
              unique_filename: true,
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });

      uploadedImages.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}