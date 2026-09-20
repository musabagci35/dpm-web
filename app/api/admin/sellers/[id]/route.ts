import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/adminSession";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/authTokens";
import { sendMail } from "@/lib/mail";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

type RouteContext = { params: Promise<{ id: string }> };

const ACTIONS = [
  "freeze",
  "unfreeze",
  "suspend",
  "unsuspend",
  "revoke-sessions",
  "disable-listings",
  "enable-listings",
  "send-reset-email",
  "add-note",
  "delete",
] as const;

/** Marks a doc as hidden by an account-level status change (freeze/suspend/delete), vs. a standalone per-listing or bulk hide — see unfreeze/unsuspend/enable-listings below for why the distinction matters. */
const STATUS_CASCADE_REASON = "seller_status_cascade";
const BULK_DISABLE_REASON = "admin_bulk_disable";

async function hideSellerContent(sellerId: string, reason: string) {
  await Promise.all([
    MarketplaceListing.updateMany(
      { sellerId },
      { $set: { adminHidden: true, adminHiddenReason: reason } }
    ),
    AuctionListing.updateMany(
      { sellerId },
      { $set: { adminHidden: true, adminHiddenReason: reason } }
    ),
  ]);
}

/** Only restores visibility for content this exact reason hid — never a listing an admin separately, deliberately hid for its own reason. */
async function restoreSellerContent(sellerId: string, reason: string) {
  await Promise.all([
    MarketplaceListing.updateMany(
      { sellerId, adminHidden: true, adminHiddenReason: reason },
      { $set: { adminHidden: false, adminHiddenReason: "" } }
    ),
    AuctionListing.updateMany(
      { sellerId, adminHidden: true, adminHiddenReason: reason },
      { $set: { adminHidden: false, adminHiddenReason: "" } }
    ),
  ]);
}

/** Full seller detail for the admin moderation screen — profile, verification, listings, auctions, and reports. Never the passwordHash or any credential hash. */
export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid seller id" }, { status: 400 });
  }

  await connectDB();
  const seller = await MarketplaceSeller.findById(id)
    .select("-passwordHash -resetTokenHash -otpHash -biometricCredentialHash")
    .lean();
  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const [listings, auctions] = await Promise.all([
    MarketplaceListing.find({ sellerId: id })
      .select("year make model trim vin status adminHidden flagged reports price createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    AuctionListing.find({ sellerId: id })
      .select("year make model trim vin status adminHidden flagged reports currentBid startingBid createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return NextResponse.json({ seller, listings, auctions });
}

/** Admin actions on a seller account — never a path that can read or set a seller's password. */
export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid seller id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (!ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await connectDB();
  const [seller, adminUser] = await Promise.all([
    MarketplaceSeller.findById(id),
    User.findById(session.userId).select("email"),
  ]);
  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") || "";
  const actorEmail = adminUser?.email || String(session.userId);
  const auditBase = {
    actorEmail,
    actorRole: "admin",
    entityType: "MarketplaceSeller",
    entityId: String(seller._id),
    ip,
    userAgent,
  };

  if (action === "freeze" || action === "suspend") {
    const reason = String(body?.reason || "").trim();
    if (!reason) {
      return NextResponse.json({ error: "A reason is required." }, { status: 400 });
    }
    seller.status = action === "freeze" ? "frozen" : "suspended";
    seller.statusReason = reason;
    seller.sessionVersion = (seller.sessionVersion || 0) + 1; // blocks/revokes every session
    seller.biometricCredentialHash = null;
    await seller.save();
    await hideSellerContent(String(seller._id), STATUS_CASCADE_REASON);
    await AuditLog.create({
      ...auditBase,
      action: action === "freeze" ? "admin.seller_frozen" : "admin.seller_suspended",
      meta: { reason },
    });
    return NextResponse.json({ success: true, status: seller.status });
  }

  if (action === "unfreeze" || action === "unsuspend") {
    seller.status = "active";
    seller.statusReason = "";
    await seller.save();
    await restoreSellerContent(String(seller._id), STATUS_CASCADE_REASON);
    await AuditLog.create({
      ...auditBase,
      action: action === "unfreeze" ? "admin.seller_unfrozen" : "admin.seller_unsuspended",
    });
    return NextResponse.json({ success: true, status: seller.status });
  }

  if (action === "revoke-sessions") {
    seller.sessionVersion = (seller.sessionVersion || 0) + 1;
    seller.biometricCredentialHash = null;
    await seller.save();
    await AuditLog.create({ ...auditBase, action: "admin.seller_sessions_revoked" });
    return NextResponse.json({ success: true });
  }

  if (action === "disable-listings") {
    await hideSellerContent(String(seller._id), BULK_DISABLE_REASON);
    await AuditLog.create({ ...auditBase, action: "admin.seller_listings_disabled" });
    return NextResponse.json({ success: true });
  }

  if (action === "enable-listings") {
    // A frozen/suspended/deleted account must stay hidden regardless — this
    // only re-enables listings an admin hid independently of account status.
    if (seller.status !== "active") {
      return NextResponse.json(
        { error: "Unfreeze or unsuspend this seller first — listings stay hidden while the account is restricted." },
        { status: 409 }
      );
    }
    await restoreSellerContent(String(seller._id), BULK_DISABLE_REASON);
    await AuditLog.create({ ...auditBase, action: "admin.seller_listings_enabled" });
    return NextResponse.json({ success: true });
  }

  if (action === "add-note") {
    const note = String(body?.note || "").trim();
    if (!note) {
      return NextResponse.json({ error: "Note text is required." }, { status: 400 });
    }
    seller.moderationNotes.push({ note, addedByEmail: actorEmail, createdAt: new Date() });
    await seller.save();
    await AuditLog.create({ ...auditBase, action: "admin.seller_note_added", meta: { note } });
    return NextResponse.json({ success: true, moderationNotes: seller.moderationNotes });
  }

  if (action === "delete") {
    if (body?.confirm !== true) {
      return NextResponse.json(
        { error: "Deletion requires explicit confirmation (confirm: true)." },
        { status: 400 }
      );
    }
    const reason = String(body?.reason || "").trim();
    const anonymizedEmail = `deleted-${seller._id}@deleted.driveprimemotors.invalid`;

    seller.status = "deleted";
    seller.statusReason = reason || "Account deleted by admin.";
    seller.deletedAt = new Date();
    // Personal info is scrubbed; the document itself, its _id, and every
    // audit log / payment / moderation record referencing it are kept.
    seller.email = anonymizedEmail;
    seller.name = "";
    seller.phone = "";
    seller.phoneVerified = false;
    seller.emailVerified = false;
    seller.sessionVersion = (seller.sessionVersion || 0) + 1;
    seller.biometricCredentialHash = null;
    seller.resetTokenHash = null;
    seller.otpHash = null;
    seller.emailVerifyTokenHash = null;
    seller.emailVerifyTokenExpiresAt = null;
    await seller.save();
    await hideSellerContent(String(seller._id), STATUS_CASCADE_REASON);

    await AuditLog.create({ ...auditBase, action: "admin.seller_deleted", meta: { reason } });
    return NextResponse.json({ success: true, status: seller.status });
  }

  // send-reset-email
  const { token, tokenHash } = generateResetToken();
  seller.resetTokenHash = tokenHash;
  seller.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  seller.resetTokenUsed = false;
  await seller.save();

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.driveprimemotorsllc.com";
  const link = `${base}/sell/reset-password?token=${token}`;
  await sendMail({
    to: seller.email,
    subject: "Reset your Drive Prime Motors seller password",
    html: `
      <h2>Reset your password</h2>
      <p>Drive Prime Motors staff requested a password reset for your seller account.</p>
      <p><a href="${link}">Reset password</a></p>
      <p>This link expires in 30 minutes and can only be used once. If you didn't expect this, contact us.</p>
    `,
  }).catch(() => {});

  await AuditLog.create({ ...auditBase, action: "admin.seller_reset_email_sent" });
  return NextResponse.json({ success: true });
}
