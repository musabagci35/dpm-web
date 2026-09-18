const RECALLS_ENDPOINT = "https://api.nhtsa.gov/recalls/recallsByVehicle";
const FETCH_TIMEOUT_MS = 8000;

export type SafetyRecall = {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportedDate: string;
};

export type RecallCheckResult = {
  supported: boolean;
  recalls: SafetyRecall[];
  error?: string;
};

/**
 * Free, official NHTSA safety recall lookup by make/model/year (no API key).
 * Never throws — returns a result object so the caller can render a clear
 * "not available" state instead of crashing the page.
 *
 * NHTSA answers a combination it has no recalls for with HTTP 400 and a body
 * of {"Count":0,"Message":"Results returned successfully","results":[]}, so the
 * body is what decides the outcome here, not the status code. Treating that
 * 400 as a failure told shoppers the recall service was down when it had in
 * fact answered "no recalls".
 */
export async function getRecallsForVehicle(
  make: string,
  model: string,
  year: string | number
): Promise<RecallCheckResult> {
  if (!make || !model || !year) {
    return { supported: false, recalls: [] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = `${RECALLS_ENDPOINT}?make=${encodeURIComponent(
      make
    )}&model=${encodeURIComponent(model)}&modelYear=${encodeURIComponent(
      String(year)
    )}`;

    const res = await fetch(url, { cache: "no-store", signal: controller.signal });

    const data = await res.json().catch(() => null);
    const results = Array.isArray(data?.results) ? data.results : null;

    if (!results) {
      return {
        supported: true,
        recalls: [],
        error: "The NHTSA recall service is currently unavailable.",
      };
    }

    return {
      supported: true,
      recalls: results.map((r: any) => ({
        campaignNumber: r.NHTSACampaignNumber || "",
        component: r.Component || "",
        summary: r.Summary || "",
        consequence: r.Consequence || "",
        remedy: r.Remedy || "",
        reportedDate: r.ReportReceivedDate || "",
      })),
    };
  } catch (err: any) {
    return {
      supported: true,
      recalls: [],
      error:
        err?.name === "AbortError"
          ? "The recall check timed out."
          : "The recall check failed. Please try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
