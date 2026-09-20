import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { VehicleHistoryReportInfo } from "@/lib/api";

function openReport(url: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    return;
  }
  Linking.openURL(url);
}

/**
 * Self-service report access — shown on every inventory car, auction, and
 * marketplace listing surface. Never claims a report exists when it
 * doesn't, and never invents or infers one from the VIN. "Contact Us" is
 * only ever the fallback shown when no report exists, never the primary
 * action when a real one is available.
 */
export default function VehicleHistoryReportButton({
  report,
  onRequestReport,
}: {
  report: VehicleHistoryReportInfo | undefined;
  /** Called when no report exists and the user wants to ask the dealer for one. */
  onRequestReport: () => void;
}) {
  if (report?.url) {
    const dateLabel = report.reportDate
      ? new Date(report.reportDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : null;

    return (
      <View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => openReport(report.url)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>View CARFAX Report</Text>
        </TouchableOpacity>
        <Text style={styles.meta}>
          Source: {report.source === "carfax" ? "CARFAX" : "Dealer-provided"}
          {dateLabel ? ` · Reported ${dateLabel}` : ""}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.unavailableBox}>
      <Text style={styles.unavailableText}>CARFAX report not available yet.</Text>
      <TouchableOpacity onPress={onRequestReport} accessibilityRole="button">
        <Text style={styles.requestLink}>Contact Us to Request a Report →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  meta: { color: "#9ca3af", fontSize: 11, marginTop: 6, textAlign: "center" },

  unavailableBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  unavailableText: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  requestLink: { color: "#9ca3af", fontWeight: "700", fontSize: 11, marginTop: 8 },
});
