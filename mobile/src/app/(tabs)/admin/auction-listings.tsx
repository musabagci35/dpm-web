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

import { AdminAuction, AuctionStatus, fetchAdminAuctions } from "@/lib/auctionApi";
import { verifyAdminSession } from "@/lib/auth";
import { formatMileage, formatTimeRemaining, vehicleTitle } from "@/lib/format";

const FILTERS: { value: AuctionStatus | "all" | "flagged"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending_review", label: "Pending Review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "sold", label: "Sold" },
  { value: "reserve_not_met", label: "Reserve Not Met" },
  { value: "ended", label: "Ended" },
  { value: "cancelled", label: "Cancelled" },
  { value: "flagged", label: "Flagged" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  pending_review: "#1d4ed8",
  scheduled: "#1d4ed8",
  live: "#15803d",
  ended: "#9ca3af",
  sold: "#111827",
  reserve_not_met: "#b45309",
  cancelled: "#9ca3af",
};

export default function AdminAuctionListingsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("pending_review");
  const [auctions, setAuctions] = useState<AdminAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (value: (typeof FILTERS)[number]["value"]) => {
    try {
      setError(null);
      const params =
        value === "all" ? undefined : value === "flagged" ? { flagged: true } : { status: value as AuctionStatus };
      setAuctions(await fetchAdminAuctions(params));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load auctions.");
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
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Auction Moderation</Text>
        <Text style={styles.bannerSubtitle}>
          Staff-only review queue for private-seller auctions. This never creates or edits bids —
          only approves, rejects, flags, pauses, or removes listings.
        </Text>
      </View>
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

          {auctions.length === 0 ? (
            <Text style={styles.muted}>No auctions in this view.</Text>
          ) : (
            auctions.map((auction) => {
              const seller = typeof auction.sellerId === "object" ? auction.sellerId : null;
              return (
                <TouchableOpacity
                  key={auction._id}
                  style={styles.card}
                  onPress={() => router.push(`/admin/auction-listing/${auction._id}`)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{vehicleTitle(auction)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[auction.status] || "#6b7280" }]}>
                      <Text style={styles.statusBadgeText}>{auction.status.replace(/_/g, " ")}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>
                    {formatMileage(auction.mileage)} · Starting ${auction.startingBid.toLocaleString()}
                    {auction.currentBid != null ? ` · Current $${auction.currentBid.toLocaleString()}` : ""}
                    {auction.status === "live" ? ` · ${formatTimeRemaining(auction.endsAt)}` : ""}
                    {auction.flagged ? " · ⚑ Flagged" : ""}
                    {auction.isTest ? " · TEST" : ""}
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
  banner: { backgroundColor: "#111827", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  bannerTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
  bannerSubtitle: { color: "#d1d5db", fontSize: 12, lineHeight: 17, marginTop: 4 },
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
