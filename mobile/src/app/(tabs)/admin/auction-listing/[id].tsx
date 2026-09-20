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
import { AdminAuction, deleteAuction, fetchAdminAuctions, moderateAuction } from "@/lib/auctionApi";
import { verifyAdminSession } from "@/lib/auth";
import { coverImageUrl, formatMileage, formatTimeRemaining, titleStatusLabel, vehicleTitle } from "@/lib/format";

export default function AdminAuctionListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [checking, setChecking] = useState(true);
  const [auction, setAuction] = useState<AdminAuction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      // Same pattern as marketplace moderation: the queue endpoint returns
      // full detail for every status, so filtering client-side keeps a
      // single admin data path instead of a second detail endpoint.
      const all = await fetchAdminAuctions();
      const found = all.find((item) => item._id === id) || null;
      if (!found) {
        setError("Auction not found.");
      } else {
        setAuction(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this auction.");
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

  async function runAction(action: () => Promise<AdminAuction | void>) {
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
    Alert.alert("Approve auction", "Make this auction live now?", [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", onPress: () => runAction(() => moderateAuction(id, { status: "live" })) },
    ]);
  }

  function handleReject() {
    if (!id) return;
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Reject auction",
        "Reason (shown to the seller):",
        (reason) => {
          if (reason == null) return;
          runAction(() => moderateAuction(id, { status: "draft", rejectionReason: reason }));
        },
        "plain-text"
      );
    } else {
      Alert.alert("Reject auction", "Reject this auction?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => runAction(() => moderateAuction(id, { status: "draft", rejectionReason: "Rejected by admin." })),
        },
      ]);
    }
  }

  function handlePause() {
    if (!id) return;
    Alert.alert("Pause auction", "Bidding will stop until you resume it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Pause", onPress: () => runAction(() => moderateAuction(id, { status: "paused" })) },
    ]);
  }

  function handleResume() {
    if (!id) return;
    runAction(() => moderateAuction(id, { status: "live" }));
  }

  function handleCancel() {
    if (!id) return;
    Alert.alert("Cancel auction", "This will end the auction with no sale. This cannot be undone.", [
      { text: "Never Mind", style: "cancel" },
      { text: "Cancel Auction", style: "destructive", onPress: () => runAction(() => moderateAuction(id, { status: "cancelled" })) },
    ]);
  }

  function handleMarkSold() {
    if (!id) return;
    Alert.alert("Mark as sold", "Mark this auction as sold outside the system?", [
      { text: "Cancel", style: "cancel" },
      { text: "Mark Sold", onPress: () => runAction(() => moderateAuction(id, { status: "sold" })) },
    ]);
  }

  function handleToggleFlag() {
    if (!id || !auction) return;
    runAction(() => moderateAuction(id, { flagged: !auction.flagged }));
  }

  function handleRemoveVideo() {
    if (!id) return;
    Alert.alert("Remove video", "Remove the video from this auction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => runAction(() => moderateAuction(id, { video: null })) },
    ]);
  }

  function handleDelete() {
    if (!id) return;
    Alert.alert("Delete auction", "Permanently delete this auction? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          runAction(async () => {
            await deleteAuction(id);
            router.replace("/admin/auction-listings");
          }),
      },
    ]);
  }

  async function handleSaveReport(input: { url: string; source: "carfax" | "other"; reportDate?: string; approved: boolean }) {
    if (!id) return;
    await runAction(() => moderateAuction(id, { vehicleHistoryReport: input }));
  }

  async function handleRemoveReport() {
    if (!id) return;
    await runAction(() => moderateAuction(id, { vehicleHistoryReport: { url: "", source: "other", approved: true } }));
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error && !auction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>{error}</Text>
      </View>
    );
  }

  if (!auction) return null;

  const seller = typeof auction.sellerId === "object" ? auction.sellerId : null;
  const poster = coverImageUrl(auction.images);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>{auction.status.replace(/_/g, " ").toUpperCase()}</Text>
        <Text style={styles.statusTitle}>{vehicleTitle(auction)}</Text>
        <Text style={styles.statusMeta}>
          {formatMileage(auction.mileage)}
          {titleStatusLabel(auction.titleStatus) ? ` · ${titleStatusLabel(auction.titleStatus)} title` : ""}
        </Text>
        <Text style={styles.statusMeta}>
          Starting ${auction.startingBid.toLocaleString()}
          {auction.currentBid != null ? ` · Current $${auction.currentBid.toLocaleString()}` : " · No bids yet"}
          {` · ${auction.bidCount} bids`}
        </Text>
        {auction.status === "live" ? <Text style={styles.statusMeta}>{formatTimeRemaining(auction.endsAt)}</Text> : null}
        {auction.isTest ? <Text style={styles.testBadge}>TEST AUCTION</Text> : null}
        {auction.flagged ? <Text style={styles.flaggedBadge}>⚑ FLAGGED{auction.flagReason ? `: ${auction.flagReason}` : ""}</Text> : null}
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

      {auction.reports?.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reports ({auction.reports.length})</Text>
          {auction.reports.map((report, i) => (
            <Text key={i} style={styles.line}>
              • {report.reason.replace(/_/g, " ")}{report.message ? `: ${report.message}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos ({auction.images.length})</Text>
        {auction.images.length > 0 ? (
          <FlatList
            horizontal
            data={auction.images}
            keyExtractor={(item, i) => `${item.url}-${i}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <Image source={{ uri: item.url }} style={styles.thumb} />}
          />
        ) : (
          <Text style={styles.line}>No photos.</Text>
        )}
      </View>

      {auction.video ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Video</Text>
          <VideoPlayerCard video={auction.video} posterUrl={poster || undefined} />
          <TouchableOpacity style={styles.removeVideoButton} onPress={handleRemoveVideo}>
            <Text style={styles.removeVideoButtonText}>Remove Video</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {auction.description ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.line}>{auction.description}</Text>
        </View>
      ) : null}

      {auction.disclosures ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seller Disclosures</Text>
          <Text style={styles.line}>{auction.disclosures}</Text>
        </View>
      ) : null}

      {auction.bids.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bid History ({auction.bids.length})</Text>
          {[...auction.bids].reverse().map((bid, i) => (
            <Text key={i} style={styles.line}>
              • {bid.bidderLabel} — ${bid.amount.toLocaleString()} — {new Date(bid.placedAt).toLocaleString()}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle History Report</Text>
        <VehicleHistoryReportEditor
          report={auction.vehicleHistoryReport as AdminVehicleHistoryReport}
          onSave={handleSaveReport}
          onRemove={handleRemoveReport}
          busy={busy}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        {auction.status === "pending_review" ? (
          <>
            <TouchableOpacity style={[styles.approveButton, busy && styles.buttonDisabled]} onPress={handleApprove} disabled={busy}>
              <Text style={styles.buttonText}>Approve — Go Live</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectButton, busy && styles.buttonDisabled]} onPress={handleReject} disabled={busy}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {auction.status === "live" ? (
          <>
            <TouchableOpacity style={[styles.approveButton, busy && styles.buttonDisabled]} onPress={handleMarkSold} disabled={busy}>
              <Text style={styles.buttonText}>Mark as Sold</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pauseButton, busy && styles.buttonDisabled]} onPress={handlePause} disabled={busy}>
              <Text style={styles.pauseButtonText}>Pause Auction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectButton, busy && styles.buttonDisabled]} onPress={handleCancel} disabled={busy}>
              <Text style={styles.rejectButtonText}>Cancel Auction</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.marketingButton}
              onPress={() => router.push(`/marketing/auction/${auction._id}`)}
              accessibilityRole="button"
            >
              <Text style={styles.marketingButtonText}>📣 Marketing Center</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {auction.status === "paused" ? (
          <>
            <TouchableOpacity style={[styles.approveButton, busy && styles.buttonDisabled]} onPress={handleResume} disabled={busy}>
              <Text style={styles.buttonText}>Resume Auction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rejectButton, busy && styles.buttonDisabled]} onPress={handleCancel} disabled={busy}>
              <Text style={styles.rejectButtonText}>Cancel Auction</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {auction.status === "scheduled" ? (
          <TouchableOpacity style={[styles.rejectButton, busy && styles.buttonDisabled]} onPress={handleCancel} disabled={busy}>
            <Text style={styles.rejectButtonText}>Cancel Auction</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={[styles.flagButton, busy && styles.buttonDisabled]} onPress={handleToggleFlag} disabled={busy}>
          <Text style={styles.flagButtonText}>{auction.flagged ? "Unflag Auction" : "Flag Auction"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteButton, busy && styles.buttonDisabled]} onPress={handleDelete} disabled={busy}>
          <Text style={styles.deleteButtonText}>Delete Auction</Text>
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
  pauseButton: { borderWidth: 1, borderColor: "#93c5fd", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  pauseButtonText: { color: "#1d4ed8", fontWeight: "800", fontSize: 14 },
  rejectButton: { borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  rejectButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 14 },
  flagButton: { borderWidth: 1, borderColor: "#fbbf24", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  flagButtonText: { color: "#92400e", fontWeight: "800", fontSize: 14 },
  marketingButton: { borderWidth: 1.5, borderColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  marketingButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  deleteButton: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  deleteButtonText: { color: "#6b7280", fontWeight: "800", fontSize: 14 },
});
