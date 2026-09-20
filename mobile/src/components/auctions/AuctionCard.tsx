import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { PublicAuction } from "@/lib/auctionApi";
import { coverImageUrl, formatBidAmount, formatMileage, formatTimeRemaining, titleStatusLabel, vehicleTitle } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  scheduled: "Upcoming",
  ended: "Ended",
  sold: "Sold",
  reserve_not_met: "Reserve Not Met",
};

const STATUS_COLORS: Record<string, string> = {
  live: "#15803d",
  scheduled: "#1d4ed8",
  ended: "#6b7280",
  sold: "#111827",
  reserve_not_met: "#b45309",
};

export default function AuctionCard({ auction, compact }: { auction: PublicAuction; compact?: boolean }) {
  const image = coverImageUrl(auction.images);
  const titleLabel = titleStatusLabel(auction.titleStatus);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => router.push(`/auctions/${auction._id}`)}
      accessibilityRole="button"
    >
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>No photo</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[auction.status] || "#6b7280" }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[auction.status] || auction.status}</Text>
        </View>
        {auction.status === "live" ? (
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>{formatTimeRemaining(auction.endsAt)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {vehicleTitle(auction)}
        </Text>
        <Text style={styles.meta}>
          {formatMileage(auction.mileage)}
          {titleLabel ? ` · ${titleLabel} title` : ""}
        </Text>

        {auction.vehicleHistoryReport?.url ? (
          <Text style={styles.reportChipText}>
            {auction.vehicleHistoryReport.source === "carfax" ? "✓ CARFAX Report" : "✓ History Report"}
          </Text>
        ) : null}

        <View style={styles.bidRow}>
          <View>
            <Text style={styles.bidLabel}>Current Bid</Text>
            <Text style={styles.bidAmount}>{formatBidAmount(auction.currentBid ?? null) === "No bids yet" ? `$${auction.startingBid.toLocaleString()}` : formatBidAmount(auction.currentBid)}</Text>
          </View>
          <Text style={styles.bidCount}>
            {auction.bidCount} {auction.bidCount === 1 ? "bid" : "bids"}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/auctions/${auction._id}`)}
            accessibilityRole="button"
          >
            <Text style={styles.viewButtonText}>View Auction</Text>
          </TouchableOpacity>
          {auction.status === "live" ? (
            <TouchableOpacity
              style={styles.bidButton}
              onPress={() => router.push(`/auctions/${auction._id}?bid=1`)}
              accessibilityRole="button"
            >
              <Text style={styles.bidButtonText}>Place Bid</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardCompact: { width: 220 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 150, backgroundColor: "#f3f4f6" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  imagePlaceholderText: { color: "#9ca3af", fontWeight: "700", fontSize: 12 },
  statusBadge: { position: "absolute", top: 10, left: 10, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  timeBadge: { position: "absolute", bottom: 10, right: 10, backgroundColor: "rgba(17,24,39,0.85)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  timeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  body: { padding: 12 },
  title: { color: "#111827", fontWeight: "900", fontSize: 14, lineHeight: 18 },
  meta: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  reportChipText: { color: "#15803d", fontSize: 11, fontWeight: "800", marginTop: 6 },

  bidRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 },
  bidLabel: { color: "#9ca3af", fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  bidAmount: { color: "#dc2626", fontWeight: "900", fontSize: 18, marginTop: 2 },
  bidCount: { color: "#6b7280", fontSize: 11, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  viewButton: { flex: 1, borderWidth: 1, borderColor: "#111827", borderRadius: 9, paddingVertical: 9, alignItems: "center" },
  viewButtonText: { color: "#111827", fontWeight: "800", fontSize: 11 },
  bidButton: { flex: 1, backgroundColor: "#dc2626", borderRadius: 9, paddingVertical: 9, alignItems: "center" },
  bidButtonText: { color: "#fff", fontWeight: "800", fontSize: 11 },
});
