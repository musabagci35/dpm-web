import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import VideoPlayerCard from "@/components/marketplace/VideoPlayerCard";
import VehicleHistoryReportButton from "@/components/shared/VehicleHistoryReportButton";
import ShareRow from "@/components/shared/ShareRow";
import { fetchListing, PublicListing, reportListing } from "@/lib/marketplaceApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { createOrReuseConversation } from "@/lib/messagesApi";
import { coverImageUrl, formatMileage, formatPrice, titleStatusLabel, vehicleTitle } from "@/lib/format";
import { WEB_BASE_URL } from "@/lib/share";

const REPORT_REASONS: { value: "suspicious" | "inaccurate" | "spam" | "already_sold" | "other"; label: string }[] = [
  { value: "suspicious", label: "Suspicious listing" },
  { value: "inaccurate", label: "Inaccurate information" },
  { value: "spam", label: "Spam" },
  { value: "already_sold", label: "Already sold" },
  { value: "other", label: "Other" },
];

export default function MarketplaceListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const [signedIn, setSignedIn] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      verifySellerSession().then((user) => setSignedIn(Boolean(user)));
    }, [])
  );

  async function handleMessageSeller() {
    if (!listing) return;
    setMessaging(true);
    setMessageError(null);
    try {
      const conversation = await createOrReuseConversation({ marketplaceListingId: listing._id });
      router.push(`/sell/conversation/${conversation._id}`);
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Could not start a conversation.");
    } finally {
      setMessaging(false);
    }
  }

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setListing(await fetchListing(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this listing.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleContactSeller() {
    if (!listing) return;
    const preferPhone =
      listing.contactPreference === "phone" ||
      (listing.contactPreference === "either" && listing.contactPhone);

    if (preferPhone && listing.contactPhone) {
      Linking.openURL(`tel:${listing.contactPhone}`);
    } else if (listing.contactEmail) {
      Linking.openURL(`mailto:${listing.contactEmail}`);
    } else if (listing.contactPhone) {
      Linking.openURL(`tel:${listing.contactPhone}`);
    }
  }

  function handleReport() {
    if (!id) return;
    Alert.alert(
      "Report this listing",
      "What's the issue?",
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason.label,
          onPress: () =>
            reportListing(id, reason.value)
              .then(() => Alert.alert("Thanks", "This listing has been reported for review."))
              .catch(() => Alert.alert("Could not submit report", "Please try again.")),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>This listing isn&apos;t available</Text>
        <Text style={styles.centeredText}>{error || "It may have been sold or removed."}</Text>
      </View>
    );
  }

  const title = vehicleTitle(listing);
  const images = listing.images || [];
  const titleLabel = titleStatusLabel(listing.titleStatus);
  const poster = coverImageUrl(images);

  const specs = [
    ["Engine", listing.engine],
    ["Transmission", listing.transmission],
    ["Drivetrain", listing.drivetrain],
    ["Fuel type", listing.fuelType],
    ["Body style", listing.bodyClass],
  ].filter(([, value]) => Boolean(value && String(value).trim())) as [string, string][];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {images.length > 0 ? (
        <>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.url}-${index}`}
            onMomentumScrollEnd={(e) => setActiveImage(Math.round(e.nativeEvent.contentOffset.x / screenWidth))}
            renderItem={({ item }) => (
              <Image source={{ uri: item.url }} style={{ width: screenWidth, height: 260 }} resizeMode="cover" />
            )}
          />
          {images.length > 1 ? (
            <View style={styles.imageFooter}>
              <View style={styles.dots}>
                {images.map((image, i) => (
                  <View key={`${image.url}-dot-${i}`} style={[styles.dot, i === activeImage && styles.dotActive]} />
                ))}
              </View>
              <Text style={styles.imageCount}>{activeImage + 1} of {images.length}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Photos coming soon</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={styles.privateSellerBadge}>
            <Text style={styles.privateSellerBadgeText}>Private Seller</Text>
          </View>
          {listing.featured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          ) : null}
          {listing.isTest ? (
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST LISTING</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>{formatMileage(listing.mileage)}</Text>
          {titleLabel ? <Text style={styles.metaItem}>{titleLabel} title</Text> : null}
        </View>

        <Text style={styles.price}>{formatPrice(listing.price)}</Text>

        <TouchableOpacity style={styles.contactButton} onPress={handleContactSeller} accessibilityRole="button">
          <Text style={styles.contactButtonText}>Contact Seller</Text>
        </TouchableOpacity>

        {listing.status === "live" && !listing.adminHidden && signedIn ? (
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

        {listing.status === "live" && !listing.adminHidden ? (
          <ShareRow
            vehicle={{
              year: listing.year,
              make: listing.make,
              model: listing.model,
              trim: listing.trim,
              mileage: listing.mileage,
              price: listing.price,
              photoUrl: poster || undefined,
              url: `${WEB_BASE_URL}/marketplace/${encodeURIComponent(listing._id)}`,
            }}
          />
        ) : null}

        {listing.video ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Video</Text>
            <VideoPlayerCard video={listing.video} posterUrl={listing.video.thumbnailUrl || poster || undefined} />
          </View>
        ) : null}

        {specs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Factory specifications</Text>
            <View style={styles.specTable}>
              {specs.map(([label, value], index) => (
                <View key={label} style={[styles.specRow, index === 0 && styles.specRowFirst]}>
                  <Text style={styles.specLabel}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.specNote}>
              From the vehicle&apos;s factory VIN decode (NHTSA). Mileage and title status are
              reported by the seller — Drive Prime Motors does not verify accident, ownership, or
              odometer history for private-seller listings.
            </Text>
          </View>
        ) : null}

        {listing.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Vehicle History Report</Text>
          <VehicleHistoryReportButton report={listing.vehicleHistoryReport} onRequestReport={handleContactSeller} />
        </View>

        <View style={styles.disclosure}>
          <Text style={styles.disclosureText}>
            This vehicle belongs to a private seller and is not owned by, or part of the inventory
            of, Drive Prime Motors LLC. Drive Prime Motors only hosts this listing.
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
  imageFooter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: "#dc2626" },
  imageCount: { color: "#6b7280", fontSize: 12, fontWeight: "700" },

  body: { padding: 16 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  privateSellerBadge: { backgroundColor: "#111827", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  privateSellerBadgeText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  featuredBadge: { backgroundColor: "#dc2626", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  featuredBadgeText: { color: "#fff", fontWeight: "900", fontSize: 11 },
  testBadge: { backgroundColor: "#fbbf24", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  testBadgeText: { color: "#111827", fontWeight: "900", fontSize: 11 },

  title: { fontSize: 22, fontWeight: "900", color: "#111827", lineHeight: 28 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  metaItem: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, fontSize: 12, color: "#374151", fontWeight: "700" },
  price: { fontSize: 26, fontWeight: "900", color: "#dc2626", marginTop: 14 },

  contactButton: { backgroundColor: "#b91c1c", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 14 },
  contactButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  messageButton: { borderWidth: 1.5, borderColor: "#111827", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 10 },
  messageButtonText: { color: "#111827", fontWeight: "800", fontSize: 15 },
  messageError: { color: "#b91c1c", fontSize: 12, fontWeight: "700", marginTop: 8, textAlign: "center" },

  section: { marginTop: 24 },
  sectionHeading: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 },
  specTable: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 14 },
  specRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  specRowFirst: { borderTopWidth: 0 },
  specLabel: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  specValue: { color: "#111827", fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  specNote: { color: "#9ca3af", fontSize: 11, lineHeight: 16, marginTop: 8 },

  description: { fontSize: 14, color: "#374151", lineHeight: 21 },

  disclosure: { marginTop: 24, backgroundColor: "#fff7ed", borderWidth: 1, borderColor: "#fed7aa", borderRadius: 14, padding: 14 },
  disclosureText: { color: "#9a3412", fontSize: 12, lineHeight: 18 },

  reportButton: { marginTop: 20, alignItems: "center", paddingVertical: 10 },
  reportButtonText: { color: "#9ca3af", fontWeight: "700", fontSize: 12, textDecorationLine: "underline" },
});
