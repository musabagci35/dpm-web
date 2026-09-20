import { connectDB } from "@/lib/mongodb";
import Lead from "@/models/Lead";

const DEALERSHIP_TIME_ZONE = "America/Los_Angeles";
const ARCHIVE_AFTER_MS = 72 * 60 * 60 * 1000;
const NON_ARCHIVABLE_STATUSES = ["won", "lost"];

/**
 * True when `date` carries no real time-of-day — i.e. it was built from a
 * bare "YYYY-MM-DD" string, which JavaScript's Date parser always resolves
 * to UTC midnight. A genuine appointment time (e.g. from a
 * datetime-local input) will essentially never land on exact UTC midnight,
 * so this is a reliable, deterministic signal rather than a guess.
 */
function isDateOnly(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/**
 * The timezone's UTC offset, in minutes, at `instant` (negative west of UTC,
 * e.g. -420 for PDT). Read directly from Intl's own offset formatting, so
 * — unlike the common "round-trip through toLocaleString + reparse" trick —
 * this never depends on the host process's own local timezone, which is
 * what matters here since dev machines and Vercel's servers run in
 * different zones.
 */
function getTimeZoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(instant);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+0";
  const match = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;
  return sign * (hours * 60 + minutes);
}

/** Converts a Y/M/D + wall-clock time in `timeZone` to the correct UTC instant. */
function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date {
  const utcGuess = new Date(Date.UTC(year, month, day, hour, minute, second, millisecond));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);
  // local = UTC + offsetMinutes, so UTC = local - offsetMinutes. `utcGuess`
  // is the wall-clock values misread as UTC, i.e. "local" — correct it.
  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
}

/** 11:59:59.999 PM, dealership-local time, for the calendar date `date` carries in UTC. */
function endOfDealershipDay(date: Date): Date {
  return zonedTimeToUtc(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23,
    59,
    59,
    999,
    DEALERSHIP_TIME_ZONE
  );
}

/**
 * The instant the appointment is considered "done" for archival purposes —
 * the appointment time itself, or, if only a date was ever provided, the
 * end of that dealership day (so a same-day appointment isn't treated as
 * already over the moment it's created).
 */
export function resolveAppointmentBasis(appointmentAt: Date): Date {
  return isDateOnly(appointmentAt) ? endOfDealershipDay(appointmentAt) : appointmentAt;
}

export function computeArchiveCutoff(appointmentAt: Date): Date {
  return new Date(resolveAppointmentBasis(appointmentAt).getTime() + ARCHIVE_AFTER_MS);
}

/**
 * Archives leads whose appointment is more than 72 hours past. Never
 * touches a lead without appointmentAt, never touches Won/Lost leads, and
 * only ever sets archived/archivedAt — nothing is deleted. Safe to call
 * repeatedly: already-archived leads are excluded from the query, so a
 * second run does nothing.
 */
export async function archiveOverdueAppointmentLeads(): Promise<{ archived: number; checked: number }> {
  await connectDB();
  const now = new Date();

  // A lead can only ever be overdue if its appointment was in the past, so
  // this is a safe (if slightly broad) prefilter — the exact 72-hour
  // cutoff, including the date-only end-of-day rule, is checked per lead
  // below before anything is written.
  const candidates = await Lead.find({
    appointmentAt: { $ne: null, $lte: now },
    archived: { $ne: true },
    status: { $nin: NON_ARCHIVABLE_STATUSES },
  }).select("_id appointmentAt");

  const overdueIds = candidates
    .filter((lead: any) => lead.appointmentAt && computeArchiveCutoff(lead.appointmentAt).getTime() <= now.getTime())
    .map((lead: any) => lead._id);

  if (overdueIds.length > 0) {
    await Lead.updateMany(
      { _id: { $in: overdueIds } },
      { $set: { archived: true, archivedAt: now } }
    );
  }

  return { archived: overdueIds.length, checked: candidates.length };
}
