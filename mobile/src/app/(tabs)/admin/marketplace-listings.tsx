import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminListing, fetchAdminMarketplaceListings, ListingStatus } from "@/lib/marketplaceApi";
import { verifyAdminSession } from "@/lib/auth";
import { formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

const FILTERS: { value: ListingStatus | "all" | "flagged"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "live", label: "Live" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "sold", label: "Sold" },
  { value: "expired", label: "Expired" },
  { value: "flagged", label: "Flagged" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  payment_pending: "#b45309",
  pending_review: "#1d4ed8",
  live: "#15803d",
  rejected: "#b91c1c",
  sold: "#111827",
  expired: "#9ca3af",
};

export default function AdminMarketplaceListingsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("pending_review");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (value: (typeof FILTERS)[number]["value"]) => {
    try {
      setError(null);
      const params =
        value === "all" ? undefined : value === "flagged" ? { flagged: true } : { status: value };
      setListings(await fetchAdminMarketplaceListings(params));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load listings.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const session = await verifyAdminSession();
        if (cancelled) return;
        if (!session) {
          router.replace("/admin/login");
          return;
        }
        setLoading(true);
        await load(filter);
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, filter])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load(filter);
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {FILTERS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.filterPill, filter === option.value && styles.filterPillSelected]}
            onPress={() => setFilter(option.value)}
          >
            <Text style={[styles.filterPillText, filter === option.value && styles.filterPillTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#dc2626" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error && <Text style={styles.error}>{error}</Text>}

          {listings.length === 0 ? (
            <Text style={styles.muted}>No listings in this view.</Text>
          ) : (
            listings.map((listing) => {
              const seller = typeof listing.sellerId === "object" ? listing.sellerId : null;
              return (
                <TouchableOpacity
                  key={listing._id}
                  style={styles.card}
                  onPress={() => router.push(`/admin/marketplace-listing/${listing._id}`)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{vehicleTitle(listing)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[listing.status] }]}>
                      <Text style={styles.statusBadgeText}>{listing.status.replace("_", " ")}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>
                    {formatMileage(listing.mileage)} · {formatPrice(listing.price)}
                    {listing.featured ? " · Featured" : ""}
                    {listing.flagged ? " · ⚑ Flagged" : ""}
                    {listing.isTest ? " · TEST" : ""}
                  </Text>
                  {seller ? (
                    <Text style={styles.sellerLine}>{seller.name || seller.email} · {seller.email}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  filterRow: { flexGrow: 0, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  filterRowContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterPill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  filterPillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  filterPillText: { color: "#374151", fontSize: 12, fontWeight: "700" },
  filterPillTextSelected: { color: "#fff" },
  content: { padding: 16, paddingBottom: 40 },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  muted: { color: "#6b7280", fontSize: 13, marginTop: 20, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 14, flex: 1 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", textTransform: "capitalize" },
  cardMeta: { color: "#6b7280", fontSize: 12, marginTop: 6 },
  sellerLine: { color: "#9ca3af", fontSize: 11, marginTop: 4 },
});
