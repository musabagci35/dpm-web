import { NextResponse } from "next/server";

import { getSellerSession } from "@/lib/sellerSession";
import cloudinary from "@/lib/cloudinary";

/**
 * Signs uploads into drive-prime-motors/marketplace — a folder kept
 * separate from drive-prime-motors/cars (the dealer's own inventory photos)
 * so seller-supplied assets are never mixed in with dealer stock.
 */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const folder = "drive-prime-motors/marketplace";
  const resourceType = body.resourceType === "video" ? "video" : "image";

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };

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
}
