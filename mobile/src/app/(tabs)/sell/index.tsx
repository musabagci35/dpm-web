import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchPublicListings, PublicListing } from "@/lib/marketplaceApi";
import { SellerUser, verifySellerSession } from "@/lib/marketplaceAuth";
import { coverImageUrl, formatMileage, formatPrice, titleStatusLabel, vehicleTitle } from "@/lib/format";

export default function SellHubScreen() {
  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setListings(await fetchPublicListings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load marketplace listings.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      verifySellerSession().then(setSeller);
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleListForSale() {
    router.push(seller ? "/sell/new" : "/sell/login");
  }

  function handleStartAuction() {
    router.push(seller ? "/sell/auction/new" : "/sell/login");
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={listings}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>PRIVATE SELLER MARKETPLACE</Text>
            <Text style={styles.heroTitle}>Sell My Car</Text>
            <Text style={styles.heroSubtitle}>
              List your own vehicle for buyers to find — a $49 listing fee keeps it live for 30
              days, with an optional $99 featured upgrade — or start an auction and let buyers bid.
              This is separate from Drive Prime Motors&apos; own dealer inventory.
            </Text>

            <View style={styles.choiceRow}>
              <TouchableOpacity style={styles.choiceCard} onPress={handleListForSale} accessibilityRole="button">
                <Text style={styles.choiceCardTitle}>List for Sale</Text>
                <Text style={styles.choiceCardSubtitle}>Set a fixed price, buyers contact you</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.choiceCard, styles.choiceCardAuction]} onPress={handleStartAuction} accessibilityRole="button">
                <Text style={styles.choiceCardTitle}>Create Auction</Text>
                <Text style={styles.choiceCardSubtitle}>Set a starting bid, buyers compete</Text>
              </TouchableOpacity>
            </View>

            {seller ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/sell/my-listings")}>
                <Text style={styles.secondaryButtonText}>My Listings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/sell/login")}>
                <Text style={styles.secondaryButtonText}>Seller Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionHeading}>
            {listings.length} {listings.length === 1 ? "listing" : "listings"} from private sellers
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#dc2626" />
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateHeading}>Couldn&apos;t load listings</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.stateBox}>
            <Text style={styles.stateHeading}>No private-seller listings yet</Text>
            <Text style={styles.stateText}>
              Be the first — list your vehicle above.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => <ListingCard listing={item} />}
    />
  );
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const image = coverImageUrl(listing.images);
  const titleLabel = titleStatusLabel(listing.titleStatus);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/marketplace/${listing._id}`)}
      accessibilityRole="button"
    >
      <View style={styles.cardImageWrap}>
        {image ? (
          <Image source={{ uri: image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>No photo</Text>
          </View>
        )}
        <View style={styles.privateSellerBadge}>
          <Text style={styles.privateSellerBadgeText}>Private Seller</Text>
        </View>
        {listing.featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {vehicleTitle(listing)}
        </Text>
        <Text style={styles.cardMeta}>
          {formatMileage(listing.mileage)}
          {titleLabel ? ` · ${titleLabel} title` : ""}
        </Text>
        <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },

  hero: { backgroundColor: "#111827", borderRadius: 18, padding: 20 },
  heroEyebrow: { color: "#fca5a5", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 8 },
  heroSubtitle: { color: "#d1d5db", fontSize: 13, lineHeight: 19, marginTop: 8 },
  choiceRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  choiceCard: { flex: 1, backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, paddingHorizontal: 10, alignItems: "center" },
  choiceCardAuction: { backgroundColor: "#1d4ed8" },
  choiceCardTitle: { color: "#fff", fontWeight: "800", fontSize: 14 },
  choiceCardSubtitle: { color: "#e5e7eb", fontSize: 10, marginTop: 4, textAlign: "center" },
  secondaryButton: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 10 },
  secondaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  sectionHeading: { color: "#111827", fontWeight: "900", fontSize: 15, marginTop: 20, marginBottom: 12 },

  stateBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", padding: 22, alignItems: "center" },
  stateHeading: { color: "#111827", fontSize: 15, fontWeight: "900", textAlign: "center" },
  stateText: { color: "#6b7280", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },

  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12, overflow: "hidden" },
  cardImageWrap: { width: 120, position: "relative" },
  cardImage: { width: 120, height: 100 },
  cardImagePlaceholder: { backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center" },
  cardImagePlaceholderText: { color: "#9ca3af", fontSize: 10, fontWeight: "700" },
  privateSellerBadge: { position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(17,24,39,0.8)", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  privateSellerBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  featuredBadge: { position: "absolute", top: 6, left: 6, backgroundColor: "#dc2626", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  featuredBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  cardBody: { flex: 1, padding: 10, justifyContent: "center" },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 14 },
  cardMeta: { color: "#6b7280", fontSize: 11, marginTop: 4 },
  cardPrice: { color: "#dc2626", fontWeight: "900", fontSize: 16, marginTop: 4 },
});
