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

import { fetchMyListings, MyListing } from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  payment_pending: "Payment Pending",
  pending_review: "Pending Review",
  live: "Live",
  rejected: "Rejected",
  sold: "Sold",
  expired: "Expired",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  payment_pending: "#b45309",
  pending_review: "#1d4ed8",
  live: "#15803d",
  rejected: "#b91c1c",
  sold: "#111827",
  expired: "#9ca3af",
};

export default function MyListingsScreen() {
  const [checking, setChecking] = useState(true);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setListings(await fetchMyListings());
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
      <TouchableOpacity style={styles.newButton} onPress={() => router.push("/sell/new")}>
        <Text style={styles.newButtonText}>+ List Another Vehicle</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {listings.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>No listings yet</Text>
          <Text style={styles.stateText}>List your vehicle to get started.</Text>
        </View>
      ) : (
        listings.map((listing) => (
          <TouchableOpacity
            key={listing._id}
            style={styles.card}
            onPress={() => router.push(`/sell/listing/${listing._id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {vehicleTitle(listing) === "Vehicle" ? "New listing" : vehicleTitle(listing)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[listing.status] }]}>
                <Text style={styles.statusBadgeText}>{STATUS_LABELS[listing.status] || listing.status}</Text>
              </View>
            </View>
            <Text style={styles.cardMeta}>
              {formatMileage(listing.mileage)} · {formatPrice(listing.price)}
              {listing.featured ? " · Featured" : ""}
              {listing.isTest ? " · TEST" : ""}
            </Text>
            {listing.status === "rejected" && listing.rejectionReason ? (
              <Text style={styles.rejectionText}>Reason: {listing.rejectionReason}</Text>
            ) : null}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  newButton: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  newButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  stateBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", padding: 22, alignItems: "center" },
  stateHeading: { color: "#111827", fontSize: 15, fontWeight: "900" },
  stateText: { color: "#6b7280", fontSize: 13, marginTop: 6 },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 14, flex: 1 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  cardMeta: { color: "#6b7280", fontSize: 12, marginTop: 6 },
  rejectionText: { color: "#b91c1c", fontSize: 12, marginTop: 6, fontWeight: "600" },
});
