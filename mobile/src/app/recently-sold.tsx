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
      const data = await fetchRecentlySold();
      setVehicles(data);
    } catch {
      setError("Could not load recently sold vehicles. Check your connection and try again.");
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

  return (
    <View style={styles.container}>
      <Text style={styles.subhead}>
        A look at vehicles Drive Prime Motors has recently sold.
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#dc2626" />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No recently sold vehicles yet.</Text>
          }
          renderItem={({ item }) => <VehicleCard vehicle={item} sold />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },
  subhead: { marginTop: 12, color: "#6b7280", fontSize: 13 },
  loading: { marginTop: 40 },
  errorBox: { marginTop: 40, alignItems: "center", gap: 14 },
  error: { textAlign: "center", color: "#6b7280", paddingHorizontal: 24 },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  list: { paddingTop: 12, paddingBottom: 40 },
  empty: { marginTop: 40, textAlign: "center", color: "#6b7280" },
});
