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

import { fetchMyAuctions, MyAuction } from "@/lib/auctionApi";
import { fetchMyListings, MyListing } from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { formatMileage, formatPrice, formatTimeRemaining, vehicleTitle } from "@/lib/format";

const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  payment_pending: "Payment Pending",
  pending_review: "Pending Review",
  live: "Live",
  rejected: "Rejected",
  sold: "Sold",
  expired: "Expired",
};

const AUCTION_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  sold: "Sold",
  reserve_not_met: "Reserve Not Met",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  payment_pending: "#b45309",
  pending_review: "#1d4ed8",
  scheduled: "#1d4ed8",
  live: "#15803d",
  rejected: "#b91c1c",
  sold: "#111827",
  expired: "#9ca3af",
  ended: "#9ca3af",
  reserve_not_met: "#b45309",
  cancelled: "#9ca3af",
};

type Row =
  | { kind: "listing"; item: MyListing; createdAt: string }
  | { kind: "auction"; item: MyAuction; createdAt: string };

export default function MyListingsScreen() {
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [listings, auctions] = await Promise.all([fetchMyListings(), fetchMyAuctions()]);
      const combined: Row[] = [
        ...listings.map((item): Row => ({ kind: "listing", item, createdAt: item.createdAt || "" })),
        ...auctions.map((item): Row => ({ kind: "auction", item, createdAt: item.createdAt || "" })),
      ].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setRows(combined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your listings.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const seller = await verifySellerSession();
        if (cancelled) return;
        if (!seller) {
          router.replace("/sell/login");
          return;
        }
        setChecking(false);
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (checking || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.newButtonRow}>
        <TouchableOpacity style={styles.newButton} onPress={() => router.push("/sell/new")}>
          <Text style={styles.newButtonText}>+ List for Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.newButton, styles.newButtonAuction]} onPress={() => router.push("/sell/auction/new")}>
          <Text style={styles.newButtonText}>+ Create Auction</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {rows.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>Nothing listed yet</Text>
          <Text style={styles.stateText}>List a vehicle for sale or start an auction to get started.</Text>
        </View>
      ) : (
        rows.map((row) =>
          row.kind === "listing" ? (
            <TouchableOpacity
              key={`listing-${row.item._id}`}
              style={styles.card}
              onPress={() => router.push(`/sell/listing/${row.item._id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>Listing</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[row.item.status] || "#6b7280" }]}>
                  <Text style={styles.statusBadgeText}>{LISTING_STATUS_LABELS[row.item.status] || row.item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {vehicleTitle(row.item) === "Vehicle" ? "New listing" : vehicleTitle(row.item)}
              </Text>
              <Text style={styles.cardMeta}>
                {formatMileage(row.item.mileage)} · {formatPrice(row.item.price)}
                {row.item.featured ? " · Featured" : ""}
                {row.item.isTest ? " · TEST" : ""}
              </Text>
              {row.item.status === "rejected" && row.item.rejectionReason ? (
                <Text style={styles.rejectionText}>Reason: {row.item.rejectionReason}</Text>
              ) : null}
              {row.item.status === "live" ? (
                <TouchableOpacity
                  style={styles.marketingButton}
                  onPress={() => router.push(`/marketing/listing/${row.item._id}`)}
                  accessibilityRole="button"
                >
                  <Text style={styles.marketingButtonText}>📣 Marketing Center</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={`auction-${row.item._id}`}
              style={styles.card}
              onPress={() => router.push(`/sell/auction/${row.item._id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, styles.typeBadgeAuction]}>
                  <Text style={styles.typeBadgeText}>Auction</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[row.item.status] || "#6b7280" }]}>
                  <Text style={styles.statusBadgeText}>{AUCTION_STATUS_LABELS[row.item.status] || row.item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {vehicleTitle(row.item) === "Vehicle" ? "New auction" : vehicleTitle(row.item)}
              </Text>
              <Text style={styles.cardMeta}>
                {formatMileage(row.item.mileage)} · Starting ${row.item.startingBid.toLocaleString()}
                {row.item.currentBid != null ? ` · Current $${row.item.currentBid.toLocaleString()}` : ""}
                {row.item.status === "live" ? ` · ${formatTimeRemaining(row.item.endsAt)}` : ""}
                {row.item.isTest ? " · TEST" : ""}
              </Text>
              {row.item.status === "draft" && row.item.rejectionReason ? (
                <Text style={styles.rejectionText}>Reason: {row.item.rejectionReason}</Text>
              ) : null}
              {row.item.status === "live" || row.item.status === "scheduled" ? (
                <TouchableOpacity
                  style={styles.marketingButton}
                  onPress={() => router.push(`/marketing/auction/${row.item._id}`)}
                  accessibilityRole="button"
                >
                  <Text style={styles.marketingButtonText}>📣 Marketing Center</Text>
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          )
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  newButtonRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  newButton: { flex: 1, backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  newButtonAuction: { backgroundColor: "#1d4ed8" },
  newButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  stateBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", padding: 22, alignItems: "center" },
  stateHeading: { color: "#111827", fontSize: 15, fontWeight: "900" },
  stateText: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  typeBadge: { backgroundColor: "#374151", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  typeBadgeAuction: { backgroundColor: "#1e3a8a" },
  typeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 14, marginTop: 10 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  cardMeta: { color: "#6b7280", fontSize: 12, marginTop: 6 },
  rejectionText: { color: "#b91c1c", fontSize: 12, marginTop: 6, fontWeight: "600" },
  marketingButton: { marginTop: 10, borderWidth: 1.5, borderColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  marketingButtonText: { color: "#111827", fontWeight: "800", fontSize: 12 },
});
