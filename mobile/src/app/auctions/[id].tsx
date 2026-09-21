import { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import VideoPlayerCard from "@/components/marketplace/VideoPlayerCard";
import VehicleHistoryReportButton from "@/components/shared/VehicleHistoryReportButton";
import ShareRow from "@/components/shared/ShareRow";
import { fetchAuction, placeBid, PublicAuction, reportAuction, toggleWatchAuction } from "@/lib/auctionApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { createOrReuseConversation } from "@/lib/messagesApi";
import { coverImageUrl, formatBidAmount, formatMileage, formatTimeRemaining, titleStatusLabel, vehicleTitle } from "@/lib/format";
import { WEB_BASE_URL } from "@/lib/share";

/** The same statuses the public API itself will actually serve — never draft/pending_review/paused, which the seller or admin can still see but a shopper never can. */
const PUBLIC_STATUSES = new Set(["live", "scheduled", "ended", "sold", "reserve_not_met"]);

const POLL_INTERVAL_MS = 15000;

const REPORT_REASONS: { value: "suspicious" | "inaccurate" | "spam" | "already_sold" | "other"; label: string }[] = [
  { value: "suspicious", label: "Suspicious listing" },
  { value: "inaccurate", label: "Inaccurate information" },
  { value: "spam", label: "Spam" },
  { value: "already_sold", label: "Already sold" },
  { value: "other", label: "Other" },
];

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [auction, setAuction] = useState<PublicAuction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const [signedIn, setSignedIn] = useState(false);
  const [watching, setWatching] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidMessage, setBidMessage] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const data = await fetchAuction(id);
        setAuction(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this auction.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
    verifySellerSession().then((seller) => setSignedIn(Boolean(seller)));
  }, [load]);

  // Polling: no WebSocket/real-time infra exists here, so a live auction is
  // refetched on an interval while this screen is open, with a visible
  // "updated Xs ago" indicator rather than pretending it's instant.
  useEffect(() => {
    if (auction?.status !== "live") return;
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [auction?.status, load]);

  async function handleToggleWatch() {
    if (!id) return;
    if (!signedIn) {
      Alert.alert("Sign in required", "Sign in to watch this auction.");
      return;
    }
    try {
      setWatching(await toggleWatchAuction(id));
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update your watchlist.");
    }
  }

  async function handlePlaceBid() {
    if (!id || !auction) return;
    setBidError(null);
    setBidMessage(null);

    if (!signedIn) {
      setBidError("Sign in to place a bid.");
      return;
    }

    const amount = Number(bidAmount);
    if (!Number.isFinite(amount) || amount < auction.nextMinBid) {
      setBidError(`Enter at least $${auction.nextMinBid.toLocaleString()}.`);
      return;
    }

    setBidding(true);
    try {
      await placeBid(id, amount);
      setBidMessage("Bid placed!");
      setBidAmount("");
      await load(true);
    } catch (err) {
      setBidError(err instanceof Error ? err.message : "Could not place your bid.");
    } finally {
      setBidding(false);
    }
  }

  function handleReport() {
    if (!id) return;
    Alert.alert("Report this auction", "What's the issue?", [
      ...REPORT_REASONS.map((r) => ({
        text: r.label,
        onPress: () =>
          reportAuction(id, r.value)
            .then(() => Alert.alert("Thanks", "This auction has been reported for review."))
            .catch(() => Alert.alert("Could not submit report", "Please try again.")),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  async function handleMessageSeller() {
    if (!auction) return;
    setMessaging(true);
    setMessageError(null);
    try {
      const conversation = await createOrReuseConversation({ auctionId: auction._id });
      router.push(`/sell/conversation/${conversation._id}`);
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Could not start a conversation.");
    } finally {
      setMessaging(false);
    }
  }

  function handleContactSeller() {
    if (!auction) return;
    const preferPhone =
      auction.contactPreference === "phone" || (auction.contactPreference === "either" && auction.contactPhone);
    if (preferPhone && auction.contactPhone) Linking.openURL(`tel:${auction.contactPhone}`);
    else if (auction.contactEmail) Linking.openURL(`mailto:${auction.contactEmail}`);
    else if (auction.contactPhone) Linking.openURL(`tel:${auction.contactPhone}`);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error || !auction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>This auction isn&apos;t available</Text>
        <Text style={styles.centeredText}>{error || "It may have ended or been removed."}</Text>
      </View>
    );
  }

  const title = vehicleTitle(auction);
  const images = auction.images || [];
  const poster = coverImageUrl(images);
  const isLive = auction.status === "live";
  const specs = [
    ["Engine", auction.engine],
    ["Transmission", auction.transmission],
    ["Drivetrain", auction.drivetrain],
    ["Fuel type", auction.fuelType],
    ["Body style", auction.bodyClass],
  ].filter(([, v]) => Boolean(v && String(v).trim())) as [string, string][];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {images.length > 0 ? (
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={{ width: screenWidth, height: 260 }} resizeMode="cover" />
          )}
        />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Photos coming soon</Text>
        </View>
      )}
      {images.length > 1 ? (
        <Text style={styles.imageCount}>
          {activeImage + 1} of {images.length}
        </Text>
      ) : null}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={styles.privateSellerBadge}>
            <Text style={styles.privateSellerBadgeText}>Private Seller Auction</Text>
          </View>
          {auction.isTest ? (
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {formatMileage(auction.mileage)}
          {titleStatusLabel(auction.titleStatus) ? ` · ${titleStatusLabel(auction.titleStatus)} title` : ""}
          {auction.location ? ` · ${auction.location}` : ""}
        </Text>

        <View style={styles.bidBox}>
          <View style={styles.bidBoxRow}>
            <View>
              <Text style={styles.bidBoxLabel}>Current Bid</Text>
              <Text style={styles.bidBoxAmount}>
                {auction.currentBid != null ? formatBidAmount(auction.currentBid) : `$${auction.startingBid.toLocaleString()} (starting)`}
              </Text>
            </View>
            <View style={styles.bidBoxRight}>
              <Text style={styles.bidBoxLabel}>{auction.bidCount} bids</Text>
              {isLive ? <Text style={styles.timeRemaining}>{formatTimeRemaining(auction.endsAt)}</Text> : null}
            </View>
          </View>

          {/* Whether a reserve exists/is met is safe to disclose — the reserve
              amount itself never is, and toPublicAuctionListing never returns it. */}
          {auction.hasReserve && isLive ? (
            <Text style={styles.reserveNote}>
              {auction.reserveMet ? "✓ Reserve met" : "Reserve not yet met"}
            </Text>
          ) : null}

          {isLive ? (
            <>
              <Text style={styles.nextMinLabel}>Next minimum bid: ${auction.nextMinBid.toLocaleString()}</Text>
              <View style={styles.bidInputRow}>
                <TextInput
                  style={styles.bidInput}
                  placeholder={`$${auction.nextMinBid.toLocaleString()}`}
                  placeholderTextColor="#9ca3af"
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  keyboardType="number-pad"
                />
                <TouchableOpacity style={styles.bidSubmitButton} onPress={handlePlaceBid} disabled={bidding}>
                  {bidding ? <ActivityIndicator color="#fff" /> : <Text style={styles.bidSubmitText}>Place Bid</Text>}
                </TouchableOpacity>
              </View>
              {auction.buyItNowPrice ? (
                <Text style={styles.buyItNow}>Buy It Now: ${auction.buyItNowPrice.toLocaleString()}</Text>
              ) : null}
              {bidError ? <Text style={styles.bidErrorText}>{bidError}</Text> : null}
              {bidMessage ? <Text style={styles.bidMessageText}>{bidMessage}</Text> : null}
              <Text style={styles.updatedText}>
                {lastUpdated ? `Updated ${Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / 1000))}s ago` : ""}
              </Text>
            </>
          ) : (
            <Text style={styles.endedText}>
              {auction.status === "sold"
                ? "This auction has ended — sold."
                : auction.status === "reserve_not_met"
                ? "This auction ended — reserve price was not met."
                : auction.status === "scheduled"
                ? `Starts ${auction.startsAt ? new Date(auction.startsAt).toLocaleString() : "soon"}.`
                : "This auction has ended."}
            </Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.watchButton} onPress={handleToggleWatch} accessibilityRole="button">
            <Text style={styles.watchButtonText}>{watching ? "★ Watching" : "☆ Watch"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller} accessibilityRole="button">
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
        </View>

        {isLive && !auction.adminHidden && signedIn ? (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessageSeller}
            disabled={messaging}
            accessibilityRole="button"
          >
            {messaging ? <ActivityIndicator color="#111827" /> : <Text style={styles.messageButtonText}>Message Seller</Text>}
          </TouchableOpacity>
        ) : null}
        {messageError ? <Text style={styles.messageError}>{messageError}</Text> : null}

        {PUBLIC_STATUSES.has(auction.status) && !auction.adminHidden ? (
          <ShareRow
            vehicle={{
              year: auction.year,
              make: auction.make,
              model: auction.model,
              trim: auction.trim,
              mileage: auction.mileage,
              price: auction.currentBid ?? auction.startingBid,
              location: auction.location,
              photoUrl: poster || undefined,
              url: `${WEB_BASE_URL}/auctions/${encodeURIComponent(auction._id)}`,
            }}
          />
        ) : null}

        {auction.video ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Video</Text>
            <VideoPlayerCard video={auction.video} posterUrl={auction.video.thumbnailUrl || poster || undefined} />
          </View>
        ) : null}

        {specs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Factory specifications</Text>
            <View style={styles.specTable}>
              {specs.map(([label, value], i) => (
                <View key={label} style={[styles.specRow, i === 0 && styles.specRowFirst]}>
                  <Text style={styles.specLabel}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {auction.disclosures ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Seller Disclosures</Text>
            <Text style={styles.description}>{auction.disclosures}</Text>
          </View>
        ) : null}

        {auction.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.description}>{auction.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Vehicle History Report</Text>
          <VehicleHistoryReportButton report={auction.vehicleHistoryReport} onRequestReport={handleContactSeller} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Bid History ({auction.bids.length})</Text>
          {auction.bids.length === 0 ? (
            <Text style={styles.noBidsText}>No bids yet — be the first.</Text>
          ) : (
            [...auction.bids].reverse().map((bid, i) => (
              <View key={i} style={styles.bidHistoryRow}>
                <Text style={styles.bidHistoryLabel}>{bid.bidderLabel}</Text>
                <Text style={styles.bidHistoryAmount}>${bid.amount.toLocaleString()}</Text>
                <Text style={styles.bidHistoryTime}>{new Date(bid.placedAt).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.disclosure}>
          <Text style={styles.disclosureText}>
            This vehicle belongs to a private seller and is not owned by, or part of the inventory
            of, Drive Prime Motors LLC. Drive Prime Motors only hosts this auction.
          </Text>
        </View>

        <TouchableOpacity style={styles.reportButton} onPress={handleReport} accessibilityRole="button">
          <Text style={styles.reportButtonText}>Report Listing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },

  noImage: { height: 260, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  noImageText: { color: "#9ca3af", fontWeight: "700" },
  imageCount: { textAlign: "center", color: "#6b7280", fontSize: 12, fontWeight: "700", marginTop: 8 },

  body: { padding: 16 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  privateSellerBadge: { backgroundColor: "#111827", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  privateSellerBadgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  testBadge: { backgroundColor: "#fbbf24", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  testBadgeText: { color: "#111827", fontWeight: "900", fontSize: 11 },

  title: { fontSize: 22, fontWeight: "900", color: "#111827", lineHeight: 28 },
  meta: { color: "#6b7280", fontSize: 13, marginTop: 6 },

  bidBox: { backgroundColor: "#111827", borderRadius: 16, padding: 18, marginTop: 16 },
  bidBoxRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bidBoxLabel: { color: "#9ca3af", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  bidBoxAmount: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 4 },
  bidBoxRight: { alignItems: "flex-end" },
  timeRemaining: { color: "#fca5a5", fontWeight: "800", fontSize: 13, marginTop: 6 },
  reserveNote: { color: "#fcd34d", fontWeight: "700", fontSize: 12, marginTop: 10 },

  nextMinLabel: { color: "#d1d5db", fontSize: 12, marginTop: 14 },
  bidInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  bidInput: { flex: 1, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, fontWeight: "800" },
  bidSubmitButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  bidSubmitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  buyItNow: { color: "#fecaca", fontSize: 12, fontWeight: "700", marginTop: 10 },
  bidErrorText: { color: "#fca5a5", fontSize: 12, fontWeight: "700", marginTop: 8 },
  bidMessageText: { color: "#86efac", fontSize: 12, fontWeight: "700", marginTop: 8 },
  updatedText: { color: "#6b7280", fontSize: 10, marginTop: 10, textAlign: "right" },
  endedText: { color: "#d1d5db", fontSize: 13, lineHeight: 19, marginTop: 12 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  watchButton: { flex: 1, borderWidth: 1, borderColor: "#111827", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  watchButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  contactButton: { flex: 1, backgroundColor: "#b91c1c", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  contactButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  messageButton: { borderWidth: 1.5, borderColor: "#111827", borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 10 },
  messageButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  messageError: { color: "#b91c1c", fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },

  section: { marginTop: 24 },
  sectionHeading: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 },
  specTable: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 14 },
  specRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  specRowFirst: { borderTopWidth: 0 },
  specLabel: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  specValue: { color: "#111827", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  description: { fontSize: 14, color: "#374151", lineHeight: 21 },

  noBidsText: { color: "#9ca3af", fontSize: 13, fontStyle: "italic" },
  bidHistoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingVertical: 10 },
  bidHistoryLabel: { color: "#374151", fontSize: 12, fontWeight: "700", flex: 1 },
  bidHistoryAmount: { color: "#111827", fontSize: 13, fontWeight: "900", marginHorizontal: 8 },
  bidHistoryTime: { color: "#9ca3af", fontSize: 10 },

  disclosure: { marginTop: 24, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 14, padding: 14 },
  disclosureText: { color: "#9a3412", fontSize: 12, lineHeight: 18 },

  reportButton: { marginTop: 20, alignItems: "center", paddingVertical: 10 },
  reportButtonText: { color: "#9ca3af", fontWeight: "700", fontSize: 12, textDecorationLine: "underline" },
});
