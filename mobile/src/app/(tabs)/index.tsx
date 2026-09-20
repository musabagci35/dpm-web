import { useCallback, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AuctionCard from "@/components/auctions/AuctionCard";
import VehicleCard from "@/components/VehicleCard";
import { fetchInventory, VehicleSummary } from "@/lib/api";
import { fetchAuctions, fetchWatchlist, PublicAuction } from "@/lib/auctionApi";
import {
  DEALER_HOURS,
  DEALER_LOCATION,
  DEALER_PHONE,
  DEALER_PHONE_DISPLAY,
} from "@/lib/constants";

type LoadState = "loading" | "loaded" | "error";

type CategoryFilter = "all" | "cars" | "suvs" | "trucks" | "under20k";

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cars", label: "Cars" },
  { key: "suvs", label: "SUVs" },
  { key: "trucks", label: "Trucks" },
  { key: "under20k", label: "Under $20K" },
];

const INVENTORY_PREVIEW_LIMIT = 8;

/**
 * bodyClass is free text from the NHTSA VIN decode (e.g. "Sedan/Saloon",
 * "Pickup", "Sport Utility Vehicle [SUV]/Multipurpose Vehicle [MPV]") — there
 * is no backend category enum to filter on, so this only classifies vehicles
 * that actually have a bodyClass on file. A vehicle with none is excluded
 * from every category chip rather than guessed at.
 */
function matchesCategory(vehicle: VehicleSummary, filter: CategoryFilter): boolean {
  if (filter === "all") return true;

  if (filter === "under20k") {
    const price = Number(vehicle.price || 0);
    return price > 0 && price <= 20000;
  }

  const bodyClass = (vehicle.bodyClass || "").toLowerCase();
  if (!bodyClass) return false;

  const isTruck = /truck|pickup/.test(bodyClass);
  const isSuv = /suv|sport utility|crossover|multipurpose/.test(bodyClass);

  if (filter === "trucks") return isTruck;
  if (filter === "suvs") return isSuv;
  return !isTruck && !isSuv; // "cars"
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [endingSoon, setEndingSoon] = useState<PublicAuction[]>([]);
  const [newlyListed, setNewlyListed] = useState<PublicAuction[]>([]);
  const [upcoming, setUpcoming] = useState<PublicAuction[]>([]);
  const [watchlist, setWatchlist] = useState<PublicAuction[]>([]);
  const [auctionsState, setAuctionsState] = useState<LoadState>("loading");

  const runSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    setActiveQuery(query);
    try {
      const data = await fetchInventory(query ? { search: query } : undefined);
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
    runSearch("");
    loadAuctions();
  }, [runSearch, loadAuctions]);

  async function onSearchSubmit() {
    setState("loading");
    await runSearch(searchInput);
  }

  async function onClearSearch() {
    setSearchInput("");
    setState("loading");
    await runSearch("");
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([runSearch(activeQuery), loadAuctions()]);
    setRefreshing(false);
  }

  const filteredVehicles = useMemo(
    () => vehicles.filter((vehicle) => matchesCategory(vehicle, categoryFilter)),
    [vehicles, categoryFilter]
  );
  const visibleVehicles = filteredVehicles.slice(0, INVENTORY_PREVIEW_LIMIT);
  const moreCount = filteredVehicles.length - visibleVehicles.length;

  // Watchlist doesn't count — an empty watchlist is normal even when
  // auctions exist, so it must never trigger the "no auctions" empty state.
  const hasAnyAuctions = endingSoon.length > 0 || newlyListed.length > 0 || upcoming.length > 0;

  function openDirections() {
    const query = encodeURIComponent("Drive Prime Motors, Rancho Cordova, CA");
    Linking.openURL(`https://maps.apple.com/?q=${query}`);
  }

  function renderInventorySection() {
    if (state === "loading") {
      return (
        <View style={styles.inventoryStateBox}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.inventoryStateText}>Loading inventory…</Text>
        </View>
      );
    }

    if (state === "error") {
      return (
        <TouchableOpacity
          style={styles.inventoryStateBox}
          onPress={() => runSearch(activeQuery)}
          accessibilityRole="button"
        >
          <Text style={styles.inventoryErrorHeading}>Couldn&apos;t load inventory</Text>
          <Text style={styles.inventoryStateText}>Tap to retry</Text>
        </TouchableOpacity>
      );
    }

    if (filteredVehicles.length === 0) {
      if (activeQuery) {
        return (
          <View style={styles.inventoryStateBox}>
            <Text style={styles.inventoryErrorHeading}>
              No vehicles match &ldquo;{activeQuery}&rdquo;
            </Text>
            <Text style={styles.inventoryStateText}>
              Try a broader search, or clear it to see everything we have.
            </Text>
            <TouchableOpacity style={styles.inventoryStateButton} onPress={onClearSearch}>
              <Text style={styles.inventoryStateButtonText}>Clear search</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (categoryFilter !== "all") {
        const label = CATEGORY_FILTERS.find((f) => f.key === categoryFilter)?.label ?? "";
        return (
          <View style={styles.inventoryStateBox}>
            <Text style={styles.inventoryErrorHeading}>No {label} in stock right now</Text>
            <TouchableOpacity
              style={styles.inventoryStateButton}
              onPress={() => setCategoryFilter("all")}
            >
              <Text style={styles.inventoryStateButtonText}>Show all inventory</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.inventoryStateBox}>
          <Text style={styles.inventoryErrorHeading}>No vehicles listed right now</Text>
          <Text style={styles.inventoryStateText}>
            Our lot turns over quickly — pull down to refresh, or check what we&apos;ve
            recently sold.
          </Text>
          <TouchableOpacity
            style={styles.inventoryStateButton}
            onPress={() => router.push("/recently-sold")}
          >
            <Text style={styles.inventoryStateButtonText}>View recently sold</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {visibleVehicles.map((vehicle) => (
          <VehicleCard key={vehicle._id} vehicle={vehicle} />
        ))}
        <TouchableOpacity
          style={styles.viewFullInventoryLink}
          onPress={() => router.push("/inventory")}
          accessibilityRole="button"
        >
          <Text style={styles.viewAllLink}>
            {moreCount > 0
              ? `View Full Inventory — ${moreCount} more →`
              : "View Full Inventory →"}
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.headerLogo}
          resizeMode="contain"
          accessibilityLabel="Drive Prime Motors (DPM) logo"
        />
        <Text style={styles.headerWordmark}>Drive Prime Motors</Text>
      </View>
      <View style={styles.headerAccentLine} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
          accessibilityRole="button"
          accessibilityLabel={`Call Drive Prime Motors at ${DEALER_PHONE_DISPLAY}`}
        >
          <View style={styles.contactCardIconWrap}>
            <Text style={styles.contactCardIcon}>📞</Text>
          </View>
          <View style={styles.contactCardTextWrap}>
            <Text style={styles.contactCardLabel}>Call Drive Prime Motors</Text>
            <Text style={styles.contactCardPhone}>{DEALER_PHONE_DISPLAY}</Text>
            <Text style={styles.contactCardLocation}>Sacramento &amp; Rancho Cordova</Text>
          </View>
          <Text style={styles.contactCardChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search make, model, or VIN"
            placeholderTextColor="#9ca3af"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchSubmit}
            accessibilityRole="button"
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        {activeQuery ? (
          <TouchableOpacity onPress={onClearSearch} accessibilityRole="button">
            <Text style={styles.clearLink}>Clear &ldquo;{activeQuery}&rdquo;</Text>
          </TouchableOpacity>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsRowContent}
        >
          {CATEGORY_FILTERS.map((filter) => {
            const active = filter.key === categoryFilter;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategoryFilter(filter.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Current Inventory</Text>
          {state === "loaded" ? (
            <Text style={styles.sectionSubheading}>
              {filteredVehicles.length} {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
              {activeQuery ? ` matching “${activeQuery}”` : " available now"}
            </Text>
          ) : null}
        </View>

        {renderInventorySection()}

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
    </View>
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
  screen: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#111827",
  },
  headerAccentLine: { height: 3, backgroundColor: "#dc2626" },
  headerLogo: { width: 30, height: 30 },
  headerWordmark: { color: "#fff", fontSize: 16, fontWeight: "900" },

  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  contactCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactCardIcon: { fontSize: 20 },
  contactCardTextWrap: { flex: 1 },
  contactCardLabel: { color: "#d1d5db", fontSize: 12, fontWeight: "700" },
  contactCardPhone: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 2 },
  contactCardLocation: { color: "#9ca3af", fontSize: 11, fontWeight: "600", marginTop: 3 },
  contactCardChevron: { color: "#6b7280", fontSize: 26, fontWeight: "900", marginLeft: 6 },

  searchRow: { flexDirection: "row", gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#111827",
  },
  searchButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "#fff", fontWeight: "800" },
  clearLink: { color: "#6b7280", fontWeight: "700", fontSize: 12, marginTop: 8 },

  chipsRow: { marginTop: 14 },
  chipsRowContent: { gap: 8, paddingRight: 4, paddingVertical: 2 },
  chip: {
    height: 38,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 19,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  chipText: { color: "#374151", fontWeight: "800", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  sectionHeader: { marginTop: 24, marginBottom: 12 },
  sectionHeading: { color: "#111827", fontWeight: "900", fontSize: 19 },
  sectionSubheading: { color: "#6b7280", fontSize: 12, marginTop: 2 },

  inventoryStateBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 22,
    alignItems: "center",
  },
  inventoryStateText: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  inventoryErrorHeading: { color: "#111827", fontWeight: "900", fontSize: 15, textAlign: "center" },
  inventoryStateButton: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  inventoryStateButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  viewFullInventoryLink: { alignItems: "center", paddingVertical: 10, marginTop: 4 },

  auctionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 26,
    marginBottom: 12,
  },
  viewAllLink: { color: "#b91c1c", fontWeight: "800", fontSize: 13 },
  auctionsErrorBox: { marginTop: 4 },
  auctionsError: { color: "#b91c1c", fontSize: 13, fontWeight: "700" },
  auctionsEmptyBox: {
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
