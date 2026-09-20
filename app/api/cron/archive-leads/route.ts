import { NextResponse } from "next/server";

import { archiveOverdueAppointmentLeads } from "@/lib/leadCleanup";

/**
 * Daily server-side sweep that archives appointment leads whose
 * appointment is more than 72 hours past (see lib/leadCleanup.ts for the
 * exact rules). Vercel Cron calls this on the schedule in vercel.json,
 * always with the standard `Authorization: Bearer ${CRON_SECRET}` header
 * it adds automatically — the same check also accepts a manual call
 * authenticated the same way, for on-demand runs or local testing.
 *
 * This is a backstop, not the only place cleanup happens: GET /api/leads
 * also runs the same sweep on every read, so a missed or delayed cron run
 * never leaves an overdue lead visible in the meantime.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured on the server." }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await archiveOverdueAppointmentLeads();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("ARCHIVE LEADS CRON ERROR:", err);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
