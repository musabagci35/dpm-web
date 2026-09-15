import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";

import VehicleCard from "@/components/VehicleCard";
import { fetchInventory, VehicleSummary } from "@/lib/api";

export default function InventoryScreen() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (searchValue: string) => {
    try {
      setError(null);
      const data = await fetchInventory(
        searchValue ? { search: searchValue } : undefined
      );
      setVehicles(data);
    } catch {
      setError("Could not load inventory. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load("").finally(() => setLoading(false));
  }, [load]);

  async function onSearchSubmit() {
    setLoading(true);
    await load(search);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await load(search);
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search make, model, VIN..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
      </View>

      <Link href="/recently-sold" style={styles.recentlySoldLink}>
        View Recently Sold →
      </Link>

      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#dc2626" />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onSearchSubmit}>
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
            <Text style={styles.empty}>No vehicles found.</Text>
          }
          renderItem={({ item }) => <VehicleCard vehicle={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },
  searchRow: { paddingTop: 12 },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  recentlySoldLink: {
    marginTop: 12,
    marginBottom: 4,
    color: "#dc2626",
    fontWeight: "700",
  },
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
