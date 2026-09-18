import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";

import VehicleCard from "@/components/VehicleCard";
import { fetchRecentlySold, RecentlySoldVehicle } from "@/lib/api";

export default function RecentlySoldScreen() {
  const [vehicles, setVehicles] = useState<RecentlySoldVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setVehicles(await fetchRecentlySold());
    } catch (loadError) {
      setVehicles([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load recently sold vehicles. Check your connection and try again."
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function onRetry() {
    setLoading(true);
    await load();
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={styles.loadingText}>Loading recently sold vehicles…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>
            Couldn&apos;t load recently sold vehicles
          </Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.stateButton} onPress={onRetry}>
            <Text style={styles.stateButtonText}>Try Again</Text>
          </TouchableOpacity>
          <Link href="/" style={styles.stateLink}>
            Browse current inventory →
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          vehicles.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerHeading}>Recently sold</Text>
              <Text style={styles.headerCount}>
                {vehicles.length}{" "}
                {vehicles.length === 1 ? "vehicle" : "vehicles"} sold
              </Text>
              <Text style={styles.headerHint}>
                These vehicles are no longer available. They&apos;re here to show
                the kind of inventory we carry — if one is close to what you
                want, tell us and we&apos;ll watch for something similar.
              </Text>
              <Link href="/" style={styles.headerLink}>
                Browse current inventory →
              </Link>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.stateBox}>
            <Text style={styles.stateHeading}>
              No sold vehicles published yet
            </Text>
            <Text style={styles.stateText}>
              We publish a vehicle here once it&apos;s marked sold in our system.
              Nothing has been published yet — everything we have is on the
              current inventory page.
            </Text>
            <Link href="/" style={styles.stateLink}>
              Browse current inventory →
            </Link>
          </View>
        }
        renderItem={({ item }) => <VehicleCard vehicle={item} sold />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },

  loadingBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },

  list: { paddingTop: 14, paddingBottom: 40 },

  header: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  headerHeading: { color: "#fff", fontSize: 19, fontWeight: "900" },
  headerCount: {
    color: "#fecaca",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  headerHint: { color: "#d1d5db", fontSize: 13, lineHeight: 18, marginTop: 8 },
  headerLink: { color: "#fca5a5", fontWeight: "900", fontSize: 13, marginTop: 12 },

  stateBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    marginTop: 28,
    alignItems: "center",
  },
  stateHeading: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  stateButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  stateButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  stateLink: { color: "#b91c1c", fontWeight: "900", fontSize: 14, marginTop: 16 },
});
