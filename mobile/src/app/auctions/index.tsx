import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AuctionCard from "@/components/auctions/AuctionCard";
import { AuctionFilters, fetchAuctions, PublicAuction } from "@/lib/auctionApi";

const STATUS_TABS: { value: AuctionFilters["status"]; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "scheduled", label: "Upcoming" },
  { value: "sold", label: "Sold" },
  { value: "reserve_not_met", label: "Reserve Not Met" },
];

const SORTS: { value: NonNullable<AuctionFilters["sort"]>; label: string }[] = [
  { value: "ending_soon", label: "Ending Soon" },
  { value: "newest", label: "Newest" },
  { value: "lowest_bid", label: "Lowest Bid" },
  { value: "most_bids", label: "Most Bids" },
];

const TITLE_STATUSES = ["clean", "salvage", "rebuilt", "title_pending", "unknown"] as const;

export default function AuctionsBoardScreen() {
  const [status, setStatus] = useState<AuctionFilters["status"]>("live");
  const [sort, setSort] = useState<NonNullable<AuctionFilters["sort"]>>("ending_soon");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [titleStatus, setTitleStatus] = useState<string>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minMileage, setMinMileage] = useState("");
  const [maxMileage, setMaxMileage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [auctions, setAuctions] = useState<PublicAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const filters: AuctionFilters = { status, sort };
      if (make.trim()) filters.make = make.trim();
      if (model.trim()) filters.model = model.trim();
      if (titleStatus) filters.titleStatus = titleStatus as any;
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minMileage) filters.minMileage = Number(minMileage);
      if (maxMileage) filters.maxMileage = Number(maxMileage);
      setAuctions(await fetchAuctions(filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load auctions.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, make, model, titleStatus, minPrice, maxPrice, minMileage, maxMileage]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function clearFilters() {
    setMake("");
    setModel("");
    setTitleStatus("");
    setMinPrice("");
    setMaxPrice("");
    setMinMileage("");
    setMaxMileage("");
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, status === tab.value && styles.tabSelected]}
            onPress={() => setStatus(tab.value)}
          >
            <Text style={[styles.tabText, status === tab.value && styles.tabTextSelected]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toolbarRow}>
        <TouchableOpacity style={styles.toolbarButton} onPress={() => setFiltersOpen(true)}>
          <Text style={styles.toolbarButtonText}>Filters</Text>
        </TouchableOpacity>
        <View style={styles.sortRow}>
          {SORTS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortPill, sort === option.value && styles.sortPillSelected]}
              onPress={() => setSort(option.value)}
            >
              <Text style={[styles.sortPillText, sort === option.value && styles.sortPillTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#dc2626" />
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>Couldn&apos;t load auctions</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => item._id}
          numColumns={1}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <Text style={styles.stateHeading}>No auctions match right now</Text>
              <Text style={styles.stateText}>Try a different status, or clear your filters.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <AuctionCard auction={item} />
            </View>
          )}
        />
      )}

      <Modal visible={filtersOpen} animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalHeading}>Filters</Text>

          <TextInput style={styles.input} placeholder="Make" value={make} onChangeText={setMake} placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Model" value={model} onChangeText={setModel} placeholderTextColor="#9ca3af" />

          <Text style={styles.fieldLabel}>Title status</Text>
          <View style={styles.pillRow}>
            {TITLE_STATUSES.map((ts) => (
              <TouchableOpacity
                key={ts}
                style={[styles.pill, titleStatus === ts && styles.pillSelected]}
                onPress={() => setTitleStatus(titleStatus === ts ? "" : ts)}
              >
                <Text style={[styles.pillText, titleStatus === ts && styles.pillTextSelected]}>
                  {ts.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Price range</Text>
          <View style={styles.twoColumns}>
            <TextInput style={[styles.input, styles.columnInput]} placeholder="Min $" value={minPrice} onChangeText={setMinPrice} keyboardType="number-pad" placeholderTextColor="#9ca3af" />
            <TextInput style={[styles.input, styles.columnInput]} placeholder="Max $" value={maxPrice} onChangeText={setMaxPrice} keyboardType="number-pad" placeholderTextColor="#9ca3af" />
          </View>

          <Text style={styles.fieldLabel}>Mileage range</Text>
          <View style={styles.twoColumns}>
            <TextInput style={[styles.input, styles.columnInput]} placeholder="Min miles" value={minMileage} onChangeText={setMinMileage} keyboardType="number-pad" placeholderTextColor="#9ca3af" />
            <TextInput style={[styles.input, styles.columnInput]} placeholder="Max miles" value={maxMileage} onChangeText={setMaxMileage} keyboardType="number-pad" placeholderTextColor="#9ca3af" />
          </View>

          <TouchableOpacity style={styles.applyButton} onPress={() => setFiltersOpen(false)}>
            <Text style={styles.applyButtonText}>Show Results</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  tabsRow: { flexDirection: "row", backgroundColor: "#111827", paddingHorizontal: 10, paddingTop: 10, paddingBottom: 10, gap: 6, flexWrap: "wrap" },
  tab: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#374151" },
  tabSelected: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  tabText: { color: "#d1d5db", fontSize: 12, fontWeight: "700" },
  tabTextSelected: { color: "#fff" },

  toolbarRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  toolbarButton: { borderWidth: 1, borderColor: "#111827", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  toolbarButtonText: { color: "#111827", fontWeight: "800", fontSize: 12 },
  sortRow: { flexDirection: "row", gap: 6, flex: 1, flexWrap: "wrap" },
  sortPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#f3f4f6" },
  sortPillSelected: { backgroundColor: "#111827" },
  sortPillText: { color: "#374151", fontSize: 11, fontWeight: "700" },
  sortPillTextSelected: { color: "#fff" },

  list: { padding: 12, paddingBottom: 40, gap: 12 },
  cardWrap: { width: "100%" },

  stateBox: { alignItems: "center", padding: 30, marginTop: 20 },
  stateHeading: { color: "#111827", fontWeight: "900", fontSize: 15, textAlign: "center" },
  stateText: { color: "#6b7280", fontSize: 13, marginTop: 6, textAlign: "center" },
  retryButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, marginTop: 14 },
  retryButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  modalContainer: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  modalHeading: { color: "#111827", fontSize: 22, fontWeight: "900", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827", marginBottom: 10 },
  fieldLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginTop: 8, marginBottom: 8, textTransform: "uppercase" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  pill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 9, paddingVertical: 8, paddingHorizontal: 12 },
  pillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  pillText: { color: "#374151", fontSize: 12, fontWeight: "700", textTransform: "capitalize" },
  pillTextSelected: { color: "#fff" },
  twoColumns: { flexDirection: "row", gap: 8 },
  columnInput: { flex: 1 },

  applyButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  applyButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  clearButton: { alignItems: "center", marginTop: 14 },
  clearButtonText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },
});
