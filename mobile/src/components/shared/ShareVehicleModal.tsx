import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { buildShareText, shareVehicle, ShareableVehicle } from "@/lib/share";

/**
 * Shows the customer exactly what will be shared — the real photo, the
 * composed text, and the link — before anything happens. Nothing is sent
 * until they tap "Share", which only ever opens the native OS share sheet;
 * the customer still picks the destination and confirms inside whatever
 * app they choose. This screen never sends or posts anything by itself.
 */
export default function ShareVehicleModal({
  visible,
  vehicle,
  onClose,
}: {
  visible: boolean;
  vehicle: ShareableVehicle | null;
  onClose: () => void;
}) {
  const [sharing, setSharing] = useState(false);

  if (!vehicle) return null;
  const previewText = buildShareText(vehicle);

  async function handleConfirmShare() {
    setSharing(true);
    try {
      await shareVehicle(vehicle!);
    } finally {
      setSharing(false);
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>Share this vehicle</Text>
          <Text style={styles.subheading}>
            You&apos;ll choose the app and recipient — nothing is sent from here.
          </Text>

          <View style={styles.previewCard}>
            {vehicle.photoUrl ? (
              <Image source={{ uri: vehicle.photoUrl }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
                <Text style={styles.previewImagePlaceholderText}>No photo</Text>
              </View>
            )}
            <Text style={styles.previewText}>{previewText}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={sharing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
              onPress={handleConfirmShare}
              disabled={sharing}
              accessibilityRole="button"
            >
              {sharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.shareButtonText}>Share…</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  heading: { fontSize: 18, fontWeight: "900", color: "#111827" },
  subheading: { color: "#6b7280", fontSize: 12, marginTop: 4, marginBottom: 16 },
  previewCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
  },
  previewImage: { width: 84, height: 84, borderRadius: 10, backgroundColor: "#f3f4f6" },
  previewImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  previewImagePlaceholderText: { color: "#9ca3af", fontSize: 10, fontWeight: "700", textAlign: "center" },
  previewText: { flex: 1, color: "#111827", fontSize: 13, lineHeight: 19 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelButtonText: { color: "#374151", fontWeight: "800", fontSize: 14 },
  shareButton: { flex: 1, backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  shareButtonDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
