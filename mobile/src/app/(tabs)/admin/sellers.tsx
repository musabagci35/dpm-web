import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AuthTextInput from "@/components/shared/AuthTextInput";
import { AdminSellerSummary, fetchAdminSellers, SellerStatus } from "@/lib/adminSellers";

const STATUS_FILTERS: { key: SellerStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "frozen", label: "Frozen" },
  { key: "suspended", label: "Suspended" },
  { key: "deleted", label: "Deleted" },
];

function statusColor(status: SellerStatus): string {
  if (status === "active") return "#15803d";
  if (status === "deleted") return "#6b7280";
  return "#b91c1c"; // frozen or suspended
}

export default function AdminSellersScreen() {
  const [sellers, setSellers] = useState<AdminSellerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SellerStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchAdminSellers({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setSellers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sellers.");
    }
  }, [search, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function onSearchSubmit() {
    setLoading(true);
    await load();
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <AuthTextInput
            placeholder="Search name, email, phone, or VIN"
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search sellers"
          />
        </View>
      </View>
      <TouchableOpacity style={styles.searchButton} onPress={onSearchSubmit} accessibilityRole="button">
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      <View style={styles.chipsRow}>
        {STATUS_FILTERS.map((filter) => {
          const active = filter.key === statusFilter;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatusFilter(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#dc2626" />
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>Couldn&apos;t load sellers</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.stateButton} onPress={onSearchSubmit}>
            <Text style={styles.stateButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sellers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <Text style={styles.stateHeading}>No sellers match</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/admin/seller/${item._id}`)}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name || item.email}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
                  <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.cardEmail} numberOfLines={1}>
                {item.email}
              </Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMeta}>
                  {item.listingCount} listings · {item.auctionCount} auctions
                </Text>
                {item.flaggedCount > 0 ? (
                  <Text style={styles.cardFlag}>⚑ {item.flaggedCount} flagged</Text>
                ) : null}
              </View>
              <View style={styles.cardMetaRow}>
                <Text style={[styles.verifyPill, item.emailVerified && styles.verifyPillOn]}>
                  {item.emailVerified ? "✓ Email verified" : "Email unverified"}
                </Text>
                <Text style={[styles.verifyPill, item.phoneVerified && styles.verifyPillOn]}>
                  {item.phoneVerified ? "✓ Phone verified" : "Phone unverified"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingHorizontal: 16 },
  searchRow: { flexDirection: "row", paddingTop: 12 },
  searchButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginBottom: 10 },
  searchButtonText: { color: "#fff", fontWeight: "800" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#374151", fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  list: { paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: "900", color: "#111827" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  cardEmail: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  cardMetaRow: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
  cardMeta: { color: "#374151", fontSize: 12, fontWeight: "600" },
  cardFlag: { color: "#b91c1c", fontSize: 12, fontWeight: "800" },
  verifyPill: { fontSize: 10, fontWeight: "800", color: "#9ca3af" },
  verifyPillOn: { color: "#15803d" },
  stateBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    marginTop: 20,
    alignItems: "center",
  },
  stateHeading: { color: "#111827", fontWeight: "900", fontSize: 15, textAlign: "center" },
  stateText: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  stateButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginTop: 14 },
  stateButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
