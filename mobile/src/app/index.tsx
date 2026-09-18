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
import VinResultCard from "@/components/VinResultCard";
import {
  fetchInventory,
  isVinLike,
  lookupVin,
  normalizeVin,
  VehicleSummary,
  VinLookupResult,
} from "@/lib/api";

type Mode = "inventory" | "vin";

export default function InventoryScreen() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [search, setSearch] = useState("");
  /** The query the results on screen actually belong to. */
  const [activeQuery, setActiveQuery] = useState("");
  const [mode, setMode] = useState<Mode>("inventory");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vinResult, setVinResult] = useState<VinLookupResult | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    const isVin = isVinLike(query);

    setError(null);
    setVinError(null);
    setActiveQuery(query);
    setMode(isVin ? "vin" : "inventory");

    if (isVin) {
      const vin = normalizeVin(query);
      setVehicles([]);

      try {
        setVinResult(await lookupVin(vin));
      } catch (lookupError) {
        setVinResult(null);
        setVinError(
          lookupError instanceof Error
            ? lookupError.message
            : "The VIN lookup failed. Please try again."
        );
      }
      return;
    }

    setVinResult(null);

    try {
      setVehicles(await fetchInventory(query ? { search: query } : undefined));
    } catch (loadError) {
      setVehicles([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load inventory. Check your connection and try again."
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    runSearch("").finally(() => setLoading(false));
  }, [runSearch]);

  async function onSubmit() {
    setLoading(true);
    await runSearch(search);
    setLoading(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await runSearch(activeQuery);
    setRefreshing(false);
  }

  async function onClear() {
    setSearch("");
    setLoading(true);
    await runSearch("");
    setLoading(false);
  }

  const searchLooksLikeVin = isVinLike(search);

  function renderHeader() {
    if (mode === "vin") {
      if (vinError) {
        return (
          <View style={styles.stateBox}>
            <Text style={styles.stateHeading}>VIN lookup unavailable</Text>
            <Text style={styles.stateText}>{vinError}</Text>
            <TouchableOpacity style={styles.stateButton} onPress={onSubmit}>
              <Text style={styles.stateButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return vinResult ? <VinResultCard result={vinResult} /> : null;
    }

    return (
      <View style={styles.inventoryHeader}>
        <Text style={styles.inventoryHeading}>
          {activeQuery ? "Search results" : "Current inventory"}
        </Text>
        <Text style={styles.inventoryCount}>
          {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
          {activeQuery ? ` matching “${activeQuery}”` : " available now"}
        </Text>
        <Text style={styles.inventoryHint}>
          Tap a vehicle for photos, specifications, pricing and contact options.
          Paste a 17-character VIN to decode any vehicle.
        </Text>
      </View>
    );
  }

  function renderEmpty() {
    if (mode === "vin") return null;

    if (activeQuery) {
      return (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>No vehicles match that search</Text>
          <Text style={styles.stateText}>
            Nothing in our current inventory matches “{activeQuery}”. Try a
            broader search such as a make or model, or clear the search to see
            everything we have.
          </Text>
          <TouchableOpacity style={styles.stateButton} onPress={onClear}>
            <Text style={styles.stateButtonText}>Show all inventory</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateBox}>
        <Text style={styles.stateHeading}>No vehicles listed right now</Text>
        <Text style={styles.stateText}>
          Our lot turns over quickly and new arrivals are added regularly. Pull
          down to refresh, or take a look at what we&apos;ve recently sold.
        </Text>
        <Link href="/recently-sold" style={styles.stateLink}>
          View recently sold →
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search make, model, or paste a VIN"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSubmit}
          accessibilityRole="button"
        >
          <Text style={styles.searchButtonText}>
            {searchLooksLikeVin ? "Decode" : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subRow}>
        {searchLooksLikeVin ? (
          <Text style={styles.vinHint}>
            That&apos;s a 17-character VIN — we&apos;ll decode it.
          </Text>
        ) : (
          <Link href="/recently-sold" style={styles.recentlySoldLink}>
            Recently Sold →
          </Link>
        )}

        {activeQuery ? (
          <TouchableOpacity onPress={onClear} accessibilityRole="button">
            <Text style={styles.clearLink}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loadingText}>
            {mode === "vin" ? "Decoding VIN…" : "Loading inventory…"}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>Couldn&apos;t load inventory</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.stateButton} onPress={onSubmit}>
            <Text style={styles.stateButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={renderEmpty()}
          renderItem={({ item }) => <VehicleCard vehicle={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },

  searchRow: { paddingTop: 12, flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  searchButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "#fff", fontWeight: "800" },

  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 2,
    minHeight: 18,
  },
  recentlySoldLink: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
  vinHint: { color: "#6b7280", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  clearLink: { color: "#6b7280", fontWeight: "700", fontSize: 13 },

  loadingBox: { marginTop: 48, alignItems: "center", gap: 12 },
  loadingText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },

  list: { paddingTop: 12, paddingBottom: 40 },

  stateBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 20,
    marginTop: 24,
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

  inventoryHeader: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  inventoryHeading: { color: "#fff", fontSize: 19, fontWeight: "900" },
  inventoryCount: {
    color: "#fecaca",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  inventoryHint: { color: "#d1d5db", fontSize: 13, lineHeight: 18, marginTop: 8 },
});
