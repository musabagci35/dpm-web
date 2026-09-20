import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AuctionCard from "@/components/auctions/AuctionCard";
import { fetchInventory, VehicleSummary } from "@/lib/api";
import { fetchAuctions, fetchWatchlist, PublicAuction } from "@/lib/auctionApi";
import {
  DEALER_HOURS,
  DEALER_LOCATION,
  DEALER_PHONE,
  DEALER_PHONE_DISPLAY,
} from "@/lib/constants";

type LoadState = "loading" | "loaded" | "error";

export default function HomeScreen() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const [endingSoon, setEndingSoon] = useState<PublicAuction[]>([]);
  const [newlyListed, setNewlyListed] = useState<PublicAuction[]>([]);
  const [upcoming, setUpcoming] = useState<PublicAuction[]>([]);
  const [watchlist, setWatchlist] = useState<PublicAuction[]>([]);
  const [auctionsState, setAuctionsState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    try {
      const data = await fetchInventory();
      setVehicles(data);
      setState("loaded");
    } catch {
      setState("error");
    }
  }, []);

  const loadAuctions = useCallback(async () => {
    try {
      const [ending, newest] = await Promise.all([
        fetchAuctions({ status: "live", sort: "ending_soon", limit: 6 }),
        fetchAuctions({ status: "live", sort: "newest", limit: 6 }),
      ]);
      setEndingSoon(ending);
      setNewlyListed(newest);
      setAuctionsState("loaded");
    } catch {
      setAuctionsState("error");
    }

    // Upcoming and watchlist are optional extras — never block the main sections on them.
    fetchAuctions({ status: "scheduled", limit: 6 })
      .then(setUpcoming)
      .catch(() => setUpcoming([]));
    fetchWatchlist()
      .then(setWatchlist)
      .catch(() => setWatchlist([])); // not signed in, or none watched — either way, just an empty section
  }, []);

  useEffect(() => {
    load();
    loadAuctions();
  }, [load, loadAuctions]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([load(), loadAuctions()]);
    setRefreshing(false);
  }

  // Watchlist doesn't count — an empty watchlist is normal even when
  // auctions exist, so it must never trigger the "no auctions" empty state.
  const hasAnyAuctions = endingSoon.length > 0 || newlyListed.length > 0 || upcoming.length > 0;

  function openDirections() {
    const query = encodeURIComponent("Drive Prime Motors, Rancho Cordova, CA");
    Linking.openURL(`https://maps.apple.com/?q=${query}`);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.hero}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Drive Prime Motors (DPM) logo"
        />

        <Text style={styles.heroEyebrow}>SACRAMENTO &amp; RANCHO CORDOVA</Text>
        <Text style={styles.heroTitle}>DPM — Drive Prime Motors</Text>
        <Text style={styles.heroSubtitle}>
          Quality pre-owned vehicles, transparent pricing, and trade-in assistance.
        </Text>

        {state === "loading" ? (
          <View style={styles.heroStatusRow}>
            <ActivityIndicator size="small" color="#fecaca" />
            <Text style={styles.heroStatusText}>Checking live inventory…</Text>
          </View>
        ) : state === "error" ? (
          <TouchableOpacity onPress={load} accessibilityRole="button">
            <Text style={styles.heroErrorText}>
              Couldn&apos;t load live inventory — tap to retry
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.heroCount}>
            {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} in stock right now
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/inventory")}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Browse Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Call {DEALER_PHONE_DISPLAY}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.auctionsHeader}>
        <View>
          <Text style={styles.sectionHeading}>Live Auctions</Text>
          <Text style={styles.sectionSubheading}>Bid on private-seller vehicles</Text>
        </View>
        {auctionsState === "loaded" && hasAnyAuctions ? (
          <TouchableOpacity onPress={() => router.push("/auctions")} accessibilityRole="button">
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {auctionsState === "loading" ? (
        <ActivityIndicator style={{ marginVertical: 20 }} color="#dc2626" />
      ) : auctionsState === "error" ? (
        <TouchableOpacity onPress={loadAuctions} accessibilityRole="button" style={styles.auctionsErrorBox}>
          <Text style={styles.auctionsError}>Couldn&apos;t load auctions — tap to retry</Text>
        </TouchableOpacity>
      ) : !hasAnyAuctions ? (
        <View style={styles.auctionsEmptyBox}>
          <Text style={styles.auctionsEmptyHeading}>No live auctions right now</Text>
          <Text style={styles.auctionsEmptyText}>Be the first to list a vehicle</Text>
          <TouchableOpacity
            style={styles.auctionsEmptyButton}
            onPress={() => router.push("/sell")}
            accessibilityRole="button"
          >
            <Text style={styles.auctionsEmptyButtonText}>Start an Auction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <AuctionRow title="Ending Soon" auctions={endingSoon} emptyText="No auctions ending soon." />
          <AuctionRow title="Newly Listed" auctions={newlyListed} emptyText="No new auctions yet." />
          <AuctionRow title="Upcoming Auctions" auctions={upcoming} emptyText="Nothing scheduled right now." />
          <AuctionRow title="My Watchlist" auctions={watchlist} emptyText="Sign in and watch an auction to see it here." />
        </>
      )}

      <View style={styles.grid}>
        <HomeCard
          title="Current Inventory"
          subtitle={
            state === "loaded"
              ? `${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"} available`
              : "Browse what's on the lot"
          }
          onPress={() => router.push("/inventory")}
        />
        <HomeCard
          title="Recently Sold"
          subtitle="See what we've sold"
          onPress={() => router.push("/recently-sold")}
        />
        <HomeCard
          title="Contact Us"
          subtitle="Call, email, or send a message"
          onPress={() => router.push("/contact")}
        />
        <HomeCard
          title="Sell Your Car"
          subtitle="List for sale or start an auction"
          onPress={() => router.push("/sell")}
        />
      </View>

      <TouchableOpacity style={styles.visitCard} onPress={openDirections} accessibilityRole="button">
        <Text style={styles.visitCardTitle}>Visit the Dealership</Text>
        <Text style={styles.visitCardLine}>{DEALER_LOCATION}</Text>
        {DEALER_HOURS.map((line) => (
          <Text key={line} style={styles.visitCardLine}>
            {line}
          </Text>
        ))}
        <Text style={styles.visitCardLink}>Get Directions →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function AuctionRow({
  title,
  auctions,
  emptyText,
}: {
  title: string;
  auctions: PublicAuction[];
  emptyText: string;
}) {
  return (
    <View style={styles.auctionRowWrap}>
      <Text style={styles.auctionRowTitle}>{title}</Text>
      {auctions.length === 0 ? (
        <Text style={styles.auctionRowEmpty}>{emptyText}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.auctionRowScroll}>
          {auctions.map((auction) => (
            <View key={auction._id} style={styles.auctionCardWrap}>
              <AuctionCard auction={auction} compact />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function HomeCard({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },

  hero: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  logo: { width: 180, height: 100, marginBottom: 12 },
  heroEyebrow: { color: "#fca5a5", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  heroStatusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  heroStatusText: { color: "#d1d5db", fontSize: 13, fontWeight: "600" },
  heroErrorText: {
    color: "#fecaca",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 14,
    textDecorationLine: "underline",
  },
  heroCount: { color: "#fecaca", fontSize: 13, fontWeight: "800", marginTop: 14 },

  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 18,
    width: "100%",
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  secondaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  auctionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 26,
  },
  sectionHeading: { color: "#111827", fontWeight: "900", fontSize: 19 },
  sectionSubheading: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  viewAllLink: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
  auctionsErrorBox: { marginTop: 12 },
  auctionsError: { color: "#b91c1c", fontSize: 13, fontWeight: "700" },
  auctionsEmptyBox: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    alignItems: "center",
  },
  auctionsEmptyHeading: { color: "#111827", fontWeight: "900", fontSize: 15, textAlign: "center" },
  auctionsEmptyText: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  auctionsEmptyButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  auctionsEmptyButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  auctionRowWrap: { marginTop: 16 },
  auctionRowTitle: { color: "#111827", fontWeight: "900", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  auctionRowEmpty: { color: "#9ca3af", fontSize: 12, fontStyle: "italic" },
  auctionRowScroll: { gap: 10, paddingRight: 4 },
  auctionCardWrap: {},

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 26 },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    minHeight: 92,
  },
  cardTitle: { color: "#111827", fontWeight: "900", fontSize: 15 },
  cardSubtitle: { color: "#6b7280", fontSize: 12, marginTop: 6, lineHeight: 17 },

  visitCard: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
  },
  visitCardTitle: { color: "#111827", fontWeight: "900", fontSize: 16, marginBottom: 8 },
  visitCardLine: { color: "#374151", fontSize: 13, lineHeight: 20 },
  visitCardLink: { color: "#b91c1c", fontWeight: "800", fontSize: 13, marginTop: 10 },
});
