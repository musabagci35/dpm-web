import * as WebBrowser from "expo-web-browser";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { VehicleHistoryReportInfo } from "@/lib/api";

/**
 * Shown on every inventory car, auction, and marketplace listing surface.
 * Never claims a report exists when it doesn't, and never labels anything
 * "CARFAX" unless an admin specifically verified it as source: "carfax" —
 * every other case (including seller-provided, admin-attached-but-generic)
 * uses the neutral "Vehicle History Report" label.
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
    const isCarfax = report.source === "carfax";
    const label = isCarfax ? "CARFAX Report" : "Vehicle History Report";
    const dateLabel = report.reportDate
      ? new Date(report.reportDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
      : null;

    return (
      <View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => WebBrowser.openBrowserAsync(report.url)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>View {label}</Text>
        </TouchableOpacity>
        <Text style={styles.meta}>
          Source: {isCarfax ? "CARFAX" : "Dealer-provided"}
          {dateLabel ? ` · Reported ${dateLabel}` : ""}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.unavailableBox}>
      <Text style={styles.unavailableText}>Report not uploaded yet</Text>
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
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
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
  requestLink: { color: "#b91c1c", fontWeight: "800", fontSize: 12, marginTop: 8 },
});
