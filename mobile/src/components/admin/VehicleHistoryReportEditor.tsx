import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export type AdminVehicleHistoryReport = {
  url: string;
  source: "carfax" | "seller_provided" | "other";
  reportDate?: string | null;
  sellerProvided?: boolean;
  approved?: boolean;
} | null | undefined;

/**
 * Staff-only editor for attaching or approving a verified vehicle history
 * report. Used identically across Car, MarketplaceListing, and
 * AuctionListing moderation — never invents a report; only ever attaches a
 * URL/date the admin explicitly provides, or approves one a seller already
 * submitted.
 */
export default function VehicleHistoryReportEditor({
  report,
  onSave,
  onRemove,
  busy,
}: {
  report: AdminVehicleHistoryReport;
  onSave: (input: { url: string; source: "carfax" | "other"; reportDate?: string; approved: boolean }) => Promise<void>;
  onRemove: () => Promise<void>;
  busy?: boolean;
}) {
  const [url, setUrl] = useState(report?.url || "");
  const [source, setSource] = useState<"carfax" | "other">(report?.source === "carfax" ? "carfax" : "other");
  const [reportDate, setReportDate] = useState(report?.reportDate ? report.reportDate.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUrl(report?.url || "");
    setSource(report?.source === "carfax" ? "carfax" : "other");
    setReportDate(report?.reportDate ? report.reportDate.slice(0, 10) : "");
  }, [report?.url, report?.source, report?.reportDate]);

  const pendingApproval = Boolean(report?.sellerProvided && report?.url && !report?.approved);

  async function handleSave(approved: boolean) {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await onSave({ url: url.trim(), source, reportDate: reportDate.trim() || undefined, approved });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      {pendingApproval ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingBannerText}>
            The seller submitted a report link that hasn&apos;t been approved yet — it will not show
            to the public until you approve or replace it.
          </Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Report URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://..."
        placeholderTextColor="#9ca3af"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.fieldLabel}>Source</Text>
      <View style={styles.pillRow}>
        {(["carfax", "other"] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pill, source === option && styles.pillSelected]}
            onPress={() => setSource(option)}
          >
            <Text style={[styles.pillText, source === option && styles.pillTextSelected]}>
              {option === "carfax" ? "CARFAX (verified)" : "Other / Dealer-provided"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Report date (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#9ca3af"
        value={reportDate}
        onChangeText={setReportDate}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.saveButton, (saving || busy || !url.trim()) && styles.buttonDisabled]}
          onPress={() => handleSave(true)}
          disabled={saving || busy || !url.trim()}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save &amp; Approve</Text>}
        </TouchableOpacity>
        {report?.url ? (
          <TouchableOpacity
            style={[styles.removeButton, (saving || busy) && styles.buttonDisabled]}
            onPress={onRemove}
            disabled={saving || busy}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pendingBanner: { backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 10, padding: 10, marginBottom: 12 },
  pendingBannerText: { color: "#92400e", fontSize: 12, lineHeight: 17 },
  fieldLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, color: "#111827", marginBottom: 4, backgroundColor: "#fff" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 8, paddingHorizontal: 11 },
  pillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { color: "#374151", fontSize: 11, fontWeight: "700" },
  pillTextSelected: { color: "#fff" },
  buttonRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
  saveButton: { flex: 1, backgroundColor: "#111827", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  removeButton: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center" },
  removeButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
});
