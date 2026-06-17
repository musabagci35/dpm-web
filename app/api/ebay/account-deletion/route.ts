import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const challengeCode = searchParams.get("challenge_code") || "";
  const verificationToken = "driveprimemotors-ebay-verification-2026";

  const endpoint =
    "https://www.driveprimemotorsllc.com/api/ebay/account-deletion";

  const hash = crypto
    .createHash("sha256")
    .update(challengeCode + verificationToken + endpoint)
    .digest("hex");

  return NextResponse.json({
    challengeResponse: hash,
  });
}

export async function POST() {
  return NextResponse.json({
    received: true,
  });
}