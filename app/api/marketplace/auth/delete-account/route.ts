import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import MarketplaceSeller from "@/models/MarketplaceSeller";
import MarketplaceListing from "@/models/MarketplaceListing";
import AuctionListing from "@/models/AuctionListing";
import AuditLog from "@/models/AuditLog";
import { getSellerSession } from "@/lib/sellerSession";
import { isSellerBlocked } from "@/lib/sellerModeration";
import { rateLimit } from "@/lib/rateLimit";

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * Same "hide everything this seller owns" cascade the admin moderation
 * route uses for freeze/suspend/delete (app/api/admin/sellers/[id]/route.ts)
 * — kept as its own small local copy here rather than importing from that
 * route (routes aren't meant to be imported from) so this self-service path
 * stays fully self-contained and never risks changing already-shipped admin
 * behavior.
 */
const STATUS_CASCADE_REASON = "seller_status_cascade";

async function hideSellerContent(sellerId: string) {
  await Promise.all([
    MarketplaceListing.updateMany(
      { sellerId },
      { $set: { adminHidden: true, adminHiddenReason: STATUS_CASCADE_REASON } }
    ),
    AuctionListing.updateMany(
      { sellerId },
      { $set: { adminHidden: true, adminHiddenReason: STATUS_CASCADE_REASON } }
    ),
  ]);
}

/**
 * Self-service account deletion (Apple Guideline 5.1.1(v)) — the
 * accountholder's own equivalent of the admin "delete" action. Requires an
 * active, non-blocked session AND a fresh password re-entry; a stolen or
 * left-open session alone is never enough to delete the account.
 *
 * This route only ever operates on the caller's own MarketplaceSeller
 * document (via getSellerSession()) and never touches models/User.ts
 * (dealer-staff/admin accounts) in any way — there is no path from here to
 * delete an admin account.
 */
export async function POST(req: Request) {
  const session = await getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`seller-delete-account:${session.sellerId}`, 5, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const password = String(body?.password || "");
  if (body?.confirm !== true || !password) {
    return NextResponse.json(
      { error: "Deletion requires your password and explicit confirmation (confirm: true)." },
      { status: 400 }
    );
  }

  await connectDB();
  const seller = await MarketplaceSeller.findById(session.sellerId);
  if (!seller || isSellerBlocked(seller.status)) {
    // A frozen/suspended account can't self-service delete — that path
    // stays admin-only, same as every other action on a restricted account.
    return NextResponse.json({ error: "This account can't be deleted right now." }, { status: 403 });
  }

  const isMatch = await bcrypt.compare(password, seller.passwordHash);
  if (!isMatch) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") || "";
  const sellerId = String(seller._id);
  // Captured before scrubbing below, purely for the audit trail (same as
  // every other AuditLog entry in this codebase, which records who
  // performed an action) — AuditLog is an admin-only internal record, not
  // anything exposed back to any client.
  const actorEmail = seller.email;

  // Same anonymization the admin "delete" action performs: the document,
  // its _id, and every audit log / payment / moderation record referencing
  // it are kept; personal info is scrubbed.
  seller.status = "deleted";
  seller.statusReason = "Account deleted by accountholder.";
  seller.deletedAt = new Date();
  seller.email = `deleted-${seller._id}@deleted.driveprimemotors.invalid`;
  seller.name = "";
  seller.phone = "";
  seller.phoneVerified = false;
  seller.emailVerified = false;
  seller.sessionVersion = (seller.sessionVersion || 0) + 1; // revokes every session, everywhere
  seller.biometricCredentialHash = null;
  seller.resetTokenHash = null;
  seller.otpHash = null;
  seller.emailVerifyTokenHash = null;
  seller.emailVerifyTokenExpiresAt = null;
  await seller.save();

  await hideSellerContent(sellerId);

  await AuditLog.create({
    actorEmail,
    actorRole: "seller",
    action: "seller.account_deleted_self",
    entityType: "MarketplaceSeller",
    entityId: sellerId,
    ip,
    userAgent,
    meta: { selfInitiated: true },
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set("seller-token", "", { expires: new Date(0), path: "/" });
  return res;
}
