import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import VideoPlayerCard from "@/components/marketplace/VideoPlayerCard";
import VehicleHistoryReportEditor, { AdminVehicleHistoryReport } from "@/components/admin/VehicleHistoryReportEditor";
import { AdminListing, deleteListing, fetchAdminMarketplaceListings, moderateListing } from "@/lib/marketplaceApi";
import { verifyAdminSession } from "@/lib/auth";
import { coverImageUrl, formatMileage, formatPrice, titleStatusLabel, vehicleTitle } from "@/lib/format";

export default function AdminMarketplaceListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [checking, setChecking] = useState(true);
  const [listing, setListing] = useState<AdminListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      // The moderation queue endpoint returns full detail for every status;
      // filtering client-side for this one id keeps a single admin data path.
      const all = await fetchAdminMarketplaceListings();
      const found = all.find((item) => item._id === id) || null;
      if (!found) {
        setError("Listing not found.");
      } else {
        setListing(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this listing.");
    }
  }, [id]);

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
        setChecking(true);
        await load();
        if (!cancelled) setChecking(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  async function runAction(action: () => Promise<AdminListing | void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  function handleApprove() {
    if (!id) return;
    Alert.alert("Approve listing", "Make this listing live for 30 days?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => runAction(() => moderateListing(id, { status: "live" })) },
    ]);
  }

  function handleReject() {
    if (!id) return;
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Reject listing",
        "Reason (shown to the seller):",
        (reason) => {
          if (reason == null) return;
          runAction(() => moderateListing(id, { status: "rejected", rejectionReason: reason }));
        },
        "plain-text"
      );
    } else {
      Alert.alert("Reject listing", "Reject this listing?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => runAction(() => moderateListing(id, { status: "rejected", rejectionReason: "Rejected by admin." })),
        },
      ]);
    }
  }

  function handleMarkSold() {
    if (!id) return;
    Alert.alert("Mark as sold", "Mark this listing as sold?", [
      { text: "Cancel", style: "cancel" },
      { text: "Mark Sold", onPress: () => runAction(() => moderateListing(id, { status: "sold" })) },
    ]);
  }

  function handleToggleFlag() {
    if (!id || !listing) return;
    runAction(() => moderateListing(id, { flagged: !listing.flagged }));
  }

  function handleRemoveVideo() {
    if (!id) return;
    Alert.alert("Remove video", "Remove the video from this listing?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => runAction(() => moderateListing(id, { video: null })) },
    ]);
  }

  async function handleSaveReport(input: { url: string; source: "carfax" | "other"; reportDate?: string; approved: boolean }) {
    if (!id) return;
    await runAction(() => moderateListing(id, { vehicleHistoryReport: input }));
  }

  async function handleRemoveReport() {
    if (!id) return;
    await runAction(() => moderateListing(id, { vehicleHistoryReport: { url: "", source: "other", approved: true } }));
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Delete listing", "Permanently delete this listing? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          runAction(async () => {
            await deleteListing(id);
            router.replace("/admin/marketplace-listings");
          }),
      },
    ]);
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error && !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>{error}</Text>
      </View>
    );
  }

  if (!listing) return null;

  const seller = typeof listing.sellerId === "object" ? listing.sellerId : null;
  const poster = coverImageUrl(listing.images);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>{listing.status.replace("_", " ").toUpperCase()}</Text>
        <Text style={styles.statusTitle}>{vehicleTitle(listing)}</Text>
        <Text style={styles.statusMeta}>
          {formatMileage(listing.mileage)} · {formatPrice(listing.price)}
          {titleStatusLabel(listing.titleStatus) ? ` · ${titleStatusLabel(listing.titleStatus)} title` : ""}
        </Text>
        {listing.isTest ? <Text style={styles.testBadge}>TEST LISTING</Text> : null}
        {listing.flagged ? <Text style={styles.flaggedBadge}>⚑ FLAGGED</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seller</Text>
        {seller ? (
          <>
            <Text style={styles.line}>{seller.name || "(no name provided)"}</Text>
            <Text style={styles.line}>{seller.email}</Text>
            {seller.phone ? <Text style={styles.line}>{seller.phone}</Text> : null}
          </>
        ) : (
          <Text style={styles.line}>Seller info unavailable.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>
        <Text style={styles.line}>
          Listing fee: {listing.payment?.paidAt ? `Paid $${((listing.payment.amountPaidCents || 0) / 100).toFixed(2)}` : "Not paid"}
        </Text>
        <Text style={styles.line}>
          Featured upgrade: {listing.featured ? `Paid $${((listing.featuredPayment?.amountPaidCents || 0) / 100).toFixed(2)}` : "Not purchased"}
        </Text>
      </View>

      {listing.reports?.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reports ({listing.reports.length})</Text>
          {listing.reports.map((report, i) => (
            <Text key={i} style={styles.line}>
              • {report.reason.replace("_", " ")}{report.message ? `: ${report.message}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos ({listing.images.length})</Text>
        {listing.images.length > 0 ? (
          <FlatList
            horizontal
            data={listing.images}
            keyExtractor={(item, i) => `${item.url}-${i}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <Image source={{ uri: item.url }} style={styles.thumb} />}
          />
        ) : (
          <Text style={styles.line}>No photos.</Text>
        )}
      </View>

      {listing.video ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video</Text>
          <VideoPlayerCard video={listing.video} posterUrl={poster || undefined} />
          <TouchableOpacity style={styles.removeVideoButton} onPress={handleRemoveVideo}>
            <Text style={styles.removeVideoButtonText}>Remove Video</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {listing.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.line}>{listing.description}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle History Report</Text>
        <VehicleHistoryReportEditor
          report={listing.vehicleHistoryReport as AdminVehicleHistoryReport}
          onSave={handleSaveReport}
          onRemove={handleRemoveReport}
          busy={busy}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {listing.status === "pending_review" ? (
          <>
            <TouchableOpacity style={[styles.approveButton, busy && styles.buttonDisabled]} onPress={handleApprove} disabled={busy}>
              <Text style={styles.buttonText}>Approve — Go Live</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectButton, busy && styles.buttonDisabled]} onPress={handleReject} disabled={busy}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {listing.status === "live" ? (
          <>
            <TouchableOpacity style={[styles.approveButton, busy && styles.buttonDisabled]} onPress={handleMarkSold} disabled={busy}>
              <Text style={styles.buttonText}>Mark as Sold</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.marketingButton}
              onPress={() => router.push(`/marketing/listing/${listing._id}`)}
              accessibilityRole="button"
            >
              <Text style={styles.marketingButtonText}>📣 Marketing Center</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity style={[styles.flagButton, busy && styles.buttonDisabled]} onPress={handleToggleFlag} disabled={busy}>
          <Text style={styles.flagButtonText}>{listing.flagged ? "Unflag Listing" : "Flag Listing"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteButton, busy && styles.buttonDisabled]} onPress={handleDelete} disabled={busy}>
          <Text style={styles.deleteButtonText}>Delete Listing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredText: { color: "#6b7280", fontSize: 13, textAlign: "center" },

  statusCard: { backgroundColor: "#111827", borderRadius: 16, padding: 18, marginBottom: 14 },
  statusLabel: { color: "#fca5a5", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  statusTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 6 },
  statusMeta: { color: "#d1d5db", fontSize: 13, marginTop: 4 },
  testBadge: { color: "#fbbf24", fontWeight: "900", fontSize: 11, marginTop: 8 },
  flaggedBadge: { color: "#fca5a5", fontWeight: "900", fontSize: 11, marginTop: 4 },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: "900", color: "#111827", marginBottom: 8 },
  line: { color: "#374151", fontSize: 13, lineHeight: 19 },

  thumb: { width: 100, height: 80, borderRadius: 10, marginRight: 8, backgroundColor: "#f3f4f6" },
  removeVideoButton: { marginTop: 10, alignItems: "center" },
  removeVideoButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 12 },

  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },

  actions: { marginTop: 8, gap: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  approveButton: { backgroundColor: "#15803d", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  rejectButton: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  rejectButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 14 },
  flagButton: { borderWidth: 1, borderColor: "#fbbf24", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  flagButtonText: { color: "#92400e", fontWeight: "800", fontSize: 14 },
  marketingButton: { borderWidth: 1.5, borderColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  marketingButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  deleteButton: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  deleteButtonText: { color: "#6b7280", fontWeight: "800", fontSize: 14 },
});
