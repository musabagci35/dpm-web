import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchInventory, VehicleSummary } from "@/lib/api";
import { DEALER_HOURS, DEALER_LOCATION, DEALER_PHONE, DEALER_PHONE_DISPLAY } from "@/lib/constants";

export default function HomeScreen() {
  const [vehicles, setVehicles] = useState<VehicleSummary[] | null>(null);

  const load = useCallback(async () => {
    try {
      setVehicles(await fetchInventory());
    } catch {
      // The home screen shows a live count as a bonus, not a requirement —
      // if inventory can't be reached right now, just omit the number
      // rather than showing an error on the landing screen.
      setVehicles(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>SACRAMENTO &amp; RANCHO CORDOVA</Text>
        <Text style={styles.heroTitle}>Drive Prime Motors</Text>
        <Text style={styles.heroSubtitle}>
          Quality pre-owned vehicles, transparent pricing, and trade-in
          assistance.
        </Text>

        {vehicles !== null ? (
          <Text style={styles.heroCount}>
            {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} in
            stock right now
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/inventory")}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Browse Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>
            Call {DEALER_PHONE_DISPLAY}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <QuickLink
          title="Recently Sold"
          subtitle="See what we've sold"
          onPress={() => router.push("/recently-sold")}
        />
        <QuickLink
          title="Contact Us"
          subtitle="Call, email, or send a message"
          onPress={() => router.push("/contact")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Visit the lot</Text>
        <Text style={styles.cardLine}>{DEALER_LOCATION}</Text>
        {DEALER_HOURS.map((line) => (
          <Text key={line} style={styles.cardLine}>
            {line}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function QuickLink({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.quickLink}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <Text style={styles.quickLinkSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },

  hero: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 22,
  },
  heroEyebrow: {
    color: "#fca5a5",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1,
  },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 8 },
  heroSubtitle: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroCount: {
    color: "#fecaca",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  grid: { flexDirection: "row", gap: 10, marginTop: 16 },
  quickLink: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  quickLinkTitle: { color: "#111827", fontWeight: "900", fontSize: 15 },
  quickLinkSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },

  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
  },
  cardTitle: { color: "#111827", fontWeight: "900", fontSize: 16, marginBottom: 8 },
  cardLine: { color: "#374151", fontSize: 13, lineHeight: 20 },
});
