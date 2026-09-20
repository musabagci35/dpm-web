import { Schema } from "mongoose";

/**
 * Shared across Car, MarketplaceListing, and AuctionListing. Never
 * generated or inferred — always either an admin-attached verified link, or
 * a seller-uploaded one that stays hidden (`approved: false`) until an
 * admin reviews it. No licensed CARFAX API is configured in this codebase,
 * so `source: "carfax"` is only ever set by an admin who has manually
 * verified a real report — the UI must never claim "carfax" on its own.
 */
export const VehicleHistoryReportSchema = new Schema(
  {
    url: { type: String, trim: true, default: "" },
    source: {
      type: String,
      enum: ["carfax", "seller_provided", "other"],
      default: "other",
    },
    reportDate: { type: Date, default: null },
    sellerProvided: { type: Boolean, default: false },
    /** Admin-attached reports are auto-approved; seller-provided ones start false. */
    approved: { type: Boolean, default: true },
  },
  { _id: false }
);

export function hasPublicVehicleHistoryReport(report: any): boolean {
  return Boolean(report?.url && report.url.trim() && report.approved);
}
