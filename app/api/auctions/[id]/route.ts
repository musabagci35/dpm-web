import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import AuctionListing from "@/models/AuctionListing";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import { getSellerSession } from "@/lib/sellerSession";
import { getAdminSession } from "@/lib/adminSession";
import { toPublicAuctionListing } from "@/lib/publicAuctionListing";
import { resolveDueAuctions } from "@/lib/resolveAuctionState";

type RouteContext = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = [
  "mileage",
  "titleStatus",
  "description",
  "disclosures",
  "contactName",
  "contactPhone",
  "contactEmail",
  "contactPreference",
  "images",
  "video",
  "startingBid",
  "reservePrice",
  "bidIncrement",
  "buyItNowPrice",
  "durationHours",
  "ownershipAttested",
  "location",
];

const PUBLIC_STATUSES = ["live", "scheduled", "ended", "sold", "reserve_not_met"];

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  await connectDB();
  await resolveDueAuctions();

  const auction = await AuctionListing.findById(id).lean();
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([getSellerSession(), getAdminSession()]);

  if (adminSession) {
    // `sellerStatus` rides along so callers (e.g. the Marketing Center) can
    // tell a frozen/suspended/deleted seller's auction apart from one whose
    // own status is still "live".
    const seller = await MarketplaceSeller.findById((auction as any).sellerId).select("status").lean();
    return NextResponse.json({ ...auction, sellerStatus: (seller as any)?.status ?? "unknown" });
  }

  if (
    PUBLIC_STATUSES.includes((auction as any).status) &&
    !(auction as any).adminHidden &&
    !(auction as any).flagged
  ) {
    return NextResponse.json(toPublicAuctionListing(auction));
  }

  const isOwner = sellerSession && String((auction as any).sellerId) === String(sellerSession.sellerId);
  if (!isOwner) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  return NextResponse.json(auction);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  await connectDB();
  const auction = await AuctionListing.findById(id);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([getSellerSession(), getAdminSession()]);
  const isOwner = sellerSession && String(auction.sellerId) === String(sellerSession.sellerId);
  const body = await req.json().catch(() => ({}));
  const update: any = {};

  if (adminSession) {
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }
    if ("status" in body) {
      const allowed = ["draft", "pending_review", "scheduled", "live", "paused", "ended", "sold", "reserve_not_met", "cancelled"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
      if (body.status === "live" && !auction.startsAt) {
        update.startsAt = new Date();
        update.endsAt = new Date(Date.now() + (auction.durationHours || 72) * 60 * 60 * 1000);
      } else if (body.status === "scheduled" && "startsAt" in body) {
        const startsAt = new Date(body.startsAt);
        update.startsAt = startsAt;
        update.endsAt = new Date(startsAt.getTime() + (auction.durationHours || 72) * 60 * 60 * 1000);
      }
      update.reviewedBy = adminSession.userId;
      update.reviewedAt = new Date();
    }
    if ("rejectionReason" in body) update.rejectionReason = String(body.rejectionReason || "");
    if ("flagged" in body) update.flagged = Boolean(body.flagged);
    if ("flagReason" in body) update.flagReason = String(body.flagReason || "");
    // Pauses/removes this one auction from public view without deleting it
    // or touching the seller's account.
    if ("adminHidden" in body) update.adminHidden = Boolean(body.adminHidden);
    if ("adminHiddenReason" in body) update.adminHiddenReason = String(body.adminHiddenReason || "");
    if ("vehicleHistoryReport" in body) {
      const report = body.vehicleHistoryReport || {};
      update.vehicleHistoryReport = {
        url: String(report.url || ""),
        source: ["carfax", "seller_provided", "other"].includes(report.source) ? report.source : "other",
        reportDate: report.reportDate ? new Date(report.reportDate) : null,
        sellerProvided: false,
        approved: report.url ? report.approved !== false : true,
      };
    }
  } else if (isOwner) {
    if (!["draft", "rejected", "pending_review"].includes(auction.status)) {
      return NextResponse.json(
        { error: `Cannot edit an auction while it is ${auction.status.replace(/_/g, " ")}.` },
        { status: 409 }
      );
    }
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }
    if ("vehicleHistoryReportUrl" in body) {
      update.vehicleHistoryReport = {
        url: String(body.vehicleHistoryReportUrl || ""),
        source: "seller_provided",
        reportDate: null,
        sellerProvided: true,
        approved: false,
      };
    }
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await AuctionListing.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid auction id" }, { status: 400 });
  }

  await connectDB();
  const auction = await AuctionListing.findById(id);
  if (!auction) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }

  const [sellerSession, adminSession] = await Promise.all([getSellerSession(), getAdminSession()]);
  const isOwner = sellerSession && String(auction.sellerId) === String(sellerSession.sellerId);

  if (!adminSession && !(isOwner && auction.status === "draft")) {
    return NextResponse.json(
      { error: "Only a draft auction can be deleted by its seller; an admin can remove any auction." },
      { status: 403 }
    );
  }

  await AuctionListing.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
