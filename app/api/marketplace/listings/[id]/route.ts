import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import MarketplaceListing from "@/models/MarketplaceListing";
import { getSellerSession } from "@/lib/sellerSession";
import { getAdminSession } from "@/lib/adminSession";
import { toPublicListing } from "@/lib/publicMarketplaceListing";
import { LISTING_ACTIVE_DAYS } from "@/lib/stripe";

type RouteContext = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = [
  "mileage",
  "titleStatus",
  "price",
  "description",
  "contactName",
  "contactPhone",
  "contactEmail",
  "contactPreference",
  "images",
  "video",
];

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  await connectDB();
  const listing = await MarketplaceListing.findById(id).lean();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([
    getSellerSession(),
    getAdminSession(),
  ]);

  // An admin always gets full detail (seller info, payment, reports),
  // regardless of status — moderating a live listing needs the same
  // information as moderating a pending one.
  if (adminSession) {
    return NextResponse.json(listing);
  }

  if ((listing as any).status === "live") {
    return NextResponse.json(toPublicListing(listing));
  }

  // Not live (or no longer live) and not an admin — only the owning seller
  // may see it, so a not-yet-approved or rejected listing is never guessable.
  const isOwner =
    sellerSession && String((listing as any).sellerId) === String(sellerSession.sellerId);

  if (!isOwner) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  await connectDB();
  const listing = await MarketplaceListing.findById(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([
    getSellerSession(),
    getAdminSession(),
  ]);

  const isOwner = sellerSession && String(listing.sellerId) === String(sellerSession.sellerId);
  const body = await req.json().catch(() => ({}));
  const update: any = {};

  if (adminSession) {
    // Moderation: status transitions and any field, for cleanup during review.
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }
    if ("status" in body) {
      const allowed = ["draft", "payment_pending", "pending_review", "live", "rejected", "sold", "expired"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
      if (body.status === "live") {
        update.listingExpiresAt = new Date(Date.now() + LISTING_ACTIVE_DAYS * 24 * 60 * 60 * 1000);
      }
      update.reviewedBy = adminSession.userId;
      update.reviewedAt = new Date();
    }
    if ("rejectionReason" in body) update.rejectionReason = String(body.rejectionReason || "");
    if ("flagged" in body) update.flagged = Boolean(body.flagged);
    if ("flagReason" in body) update.flagReason = String(body.flagReason || "");
  } else if (isOwner) {
    // A seller may only edit their own listing while it hasn't been
    // submitted for review or is bounced back as rejected — never while
    // payment/review/live/sold, which would let content change out from
    // under an approval or an already-paid, already-published listing.
    if (!["draft", "rejected"].includes(listing.status)) {
      return NextResponse.json(
        { error: `Cannot edit a listing while it is ${listing.status.replace("_", " ")}.` },
        { status: 409 }
      );
    }
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }
    // Editing a rejected listing puts it back in draft so the seller can
    // resubmit it through the normal payment → review flow.
    if (listing.status === "rejected") {
      update.status = "draft";
      update.rejectionReason = "";
    }
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await MarketplaceListing.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
  }

  await connectDB();
  const listing = await MarketplaceListing.findById(id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([
    getSellerSession(),
    getAdminSession(),
  ]);

  const isOwner = sellerSession && String(listing.sellerId) === String(sellerSession.sellerId);

  if (!adminSession && !(isOwner && listing.status === "draft")) {
    return NextResponse.json(
      { error: "Only a draft listing can be deleted by its seller; an admin can remove any listing." },
      { status: 403 }
    );
  }

  await MarketplaceListing.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
