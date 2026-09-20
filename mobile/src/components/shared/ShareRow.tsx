import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { copyVehicleLink, ShareableVehicle } from "@/lib/share";
import ShareVehicleModal from "./ShareVehicleModal";

/** Share + Copy Link, used on every vehicle detail screen (dealer inventory, marketplace listing). */
export default function ShareRow({ vehicle }: { vehicle: ShareableVehicle }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleCopy() {
    await copyVehicleLink(vehicle.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setPreviewOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Share this vehicle"
      >
        <Text style={styles.buttonText}>⤴ Share</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={handleCopy}
        accessibilityRole="button"
        accessibilityLabel="Copy link to this vehicle"
      >
        <Text style={styles.buttonText}>{copied ? "✓ Copied" : "🔗 Copy Link"}</Text>
      </TouchableOpacity>

      <ShareVehicleModal visible={previewOpen} vehicle={vehicle} onClose={() => setPreviewOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  button: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
});
