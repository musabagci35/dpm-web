import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { fetchAdminCar } from "@/lib/api";
import { verifyAdminSession } from "@/lib/auth";
import { fetchListing, fetchMyListings } from "@/lib/marketplaceApi";
import { fetchAuction, fetchMyAuctions } from "@/lib/auctionApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { coverImageUrl, formatMileage, formatPrice, titleStatusLabel, vehicleTitle } from "@/lib/format";
import { WEB_BASE_URL, copyText, copyVehicleLink, shareCustomText } from "@/lib/share";
import {
  generateCaption,
  MANUAL_POSTING_NOTE,
  MARKETING_PLATFORMS,
  MarketableVehicle,
  MarketingPlatform,
} from "@/lib/marketingCaptions";

type MarketableType = "car" | "listing" | "auction";

const PROMOTE_DURATIONS = [
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
];

export default function MarketingCenterScreen() {
  const { type, id } = useLocalSearchParams<{ type: MarketableType; id: string }>();

  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<MarketableVehicle | null>(null);
  const [images, setImages] = useState<{ url: string }[]>([]);

  const [platform, setPlatform] = useState<MarketingPlatform>("facebook");
  const [captions, setCaptions] = useState<Partial<Record<MarketingPlatform, string>>>({});
  const [copied, setCopied] = useState<"caption" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setDenied(null);
    try {
      const [admin, seller] = await Promise.all([verifyAdminSession(), verifySellerSession()]);
      const isAdmin = Boolean(admin);

      if (type === "car") {
        if (!isAdmin) {
          setDenied("Only Drive Prime Motors staff can access marketing tools for dealer inventory.");
          return;
        }
        const car = await fetchAdminCar(id);
        if (car.status !== "available" && car.status !== "pending") {
          setDenied("This vehicle isn't currently for sale, so it can't be marketed.");
          return;
        }
        if (car.isActive === false) {
          setDenied("This vehicle is hidden from the site, so it can't be marketed.");
          return;
        }
        setImages(car.images || []);
        setVehicle({
          year: car.year,
          make: car.make,
          model: car.model,
          trim: car.trim,
          mileage: car.mileage,
          priceLabel: formatPrice(car.price),
          location: "Sacramento & Rancho Cordova, CA",
          titleStatusLabel: titleStatusLabel(car.titleStatus),
          hasVehicleHistoryReport: Boolean(car.vehicleHistoryReport?.url),
          url: `${WEB_BASE_URL}/inventory/${encodeURIComponent(car.slug)}`,
        });
        return;
      }

      if (type === "listing") {
        let listing: any = null;
        if (isAdmin) {
          listing = await fetchListing(id);
        } else if (seller) {
          const mine = await fetchMyListings();
          listing = mine.find((l) => l._id === id) || null;
        }
        if (!listing) {
          setDenied("You can only market your own listings — sign in as the seller or as staff.");
          return;
        }
        if (listing.status !== "live" || listing.adminHidden || listing.flagged) {
          setDenied("This listing isn't currently approved and public, so it can't be marketed.");
          return;
        }
        if (isAdmin && listing.sellerStatus && listing.sellerStatus !== "active") {
          setDenied("This listing's seller account isn't active, so it can't be marketed.");
          return;
        }
        setImages(listing.images || []);
        setVehicle({
          year: listing.year,
          make: listing.make,
          model: listing.model,
          trim: listing.trim,
          mileage: listing.mileage,
          priceLabel: formatPrice(listing.price),
          location: listing.location || undefined,
          titleStatusLabel: titleStatusLabel(listing.titleStatus),
          hasVehicleHistoryReport: Boolean(listing.vehicleHistoryReport?.url),
          url: `${WEB_BASE_URL}/marketplace/${encodeURIComponent(listing._id)}`,
        });
        return;
      }

      if (type === "auction") {
        let auction: any = null;
        if (isAdmin) {
          auction = await fetchAuction(id);
        } else if (seller) {
          const mine = await fetchMyAuctions();
          auction = mine.find((a) => a._id === id) || null;
        }
        if (!auction) {
          setDenied("You can only market your own auctions — sign in as the seller or as staff.");
          return;
        }
        if (!["live", "scheduled"].includes(auction.status) || auction.adminHidden || auction.flagged) {
          setDenied(
            auction.status === "ended" || auction.status === "sold" || auction.status === "reserve_not_met"
              ? "This auction has already ended and can no longer be promoted."
              : "This auction isn't currently approved and public, so it can't be marketed."
          );
          return;
        }
        if (isAdmin && auction.sellerStatus && auction.sellerStatus !== "active") {
          setDenied("This auction's seller account isn't active, so it can't be marketed.");
          return;
        }
        setImages(auction.images || []);
        setVehicle({
          year: auction.year,
          make: auction.make,
          model: auction.model,
          trim: auction.trim,
          mileage: auction.mileage,
          priceLabel:
            auction.currentBid != null
              ? `Current Bid: $${auction.currentBid.toLocaleString()}`
              : `Starting Bid: $${auction.startingBid.toLocaleString()}`,
          location: auction.location || undefined,
          endsAt: auction.endsAt,
          titleStatusLabel: titleStatusLabel(auction.titleStatus),
          hasVehicleHistoryReport: Boolean(auction.vehicleHistoryReport?.url),
          url: `${WEB_BASE_URL}/auctions/${encodeURIComponent(auction._id)}`,
        });
        return;
      }

      setDenied("Unknown marketing target.");
    } catch (err) {
      setDenied(err instanceof Error ? err.message : "Could not load this listing.");
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function currentCaption(): string {
    if (!vehicle) return "";
    if (captions[platform] != null) return captions[platform]!;
    return generateCaption(platform, vehicle);
  }

  function setCurrentCaption(text: string) {
    setCaptions((prev) => ({ ...prev, [platform]: text }));
  }

  async function handleCopyCaption() {
    await copyText(currentCaption());
    setCopied("caption");
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCopyLink() {
    if (!vehicle) return;
    await copyVehicleLink(vehicle.url);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare() {
    if (!vehicle) return;
    setSharing(true);
    try {
      await shareCustomText(currentCaption(), vehicle.url);
    } finally {
      setSharing(false);
    }
  }

  async function handleDownloadPhotos() {
    if (images.length === 0) return;

    // expo-media-library and the File.downloadFileAsync flow have no web
    // implementation at all. Opening each photo's URL with window.open (via
    // Linking.openURL) doesn't work for more than one photo — browsers
    // (Safari especially) block every window.open beyond the first one
    // fired in the same synchronous handler. Fetching each photo as a blob
    // and triggering an <a download> click instead never opens a new
    // browsing context at all, so it isn't subject to that popup block.
    if (Platform.OS === "web") {
      setDownloading(true);
      try {
        for (let i = 0; i < images.length; i++) {
          try {
            const response = await fetch(images[i].url);
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = `listing-photo-${i + 1}.jpg`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(objectUrl);
          } catch {
            // Skip a photo that failed to fetch and keep going with the rest.
          }
        }
      } finally {
        setDownloading(false);
      }
      return;
    }

    setDownloading(true);
    try {
      const { File, Paths } = await import("expo-file-system");
      const MediaLibrary = await import("expo-media-library");

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photo library access needed", "Enable photo library access in Settings to download photos.");
        return;
      }

      let saved = 0;
      for (let i = 0; i < images.length; i++) {
        const destination = new File(Paths.cache, `listing-photo-${Date.now()}-${i}.jpg`);
        const file = await File.downloadFileAsync(images[i].url, destination, { idempotent: true });
        await MediaLibrary.saveToLibraryAsync(file.uri);
        saved += 1;
      }
      Alert.alert("Saved", `${saved} photo${saved === 1 ? "" : "s"} saved to your photo library.`);
    } catch (err) {
      Alert.alert("Download failed", err instanceof Error ? err.message : "Could not download photos.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (denied || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Marketing Center unavailable</Text>
        <Text style={styles.centeredText}>{denied || "This listing could not be loaded."}</Text>
      </View>
    );
  }

  const coverImage = coverImageUrl(images);
  const selectedPlatformMeta = MARKETING_PLATFORMS.find((p) => p.key === platform);
  const title = vehicleTitle({ year: vehicle.year, make: vehicle.make, model: vehicle.model, trim: vehicle.trim });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={styles.previewImage} />
        ) : (
          <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
            <Text style={styles.previewImagePlaceholderText}>No photo</Text>
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {formatMileage(vehicle.mileage)} · {vehicle.priceLabel}
          {vehicle.location ? ` · ${vehicle.location}` : ""}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Platform</Text>
        <View style={styles.chipsRow}>
          {MARKETING_PLATFORMS.map((p) => {
            const active = p.key === platform;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPlatform(p.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedPlatformMeta?.manual ? (
          <Text style={styles.manualNote}>{MANUAL_POSTING_NOTE}</Text>
        ) : null}

        <Text style={styles.cardTitle}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          value={currentCaption()}
          onChangeText={setCurrentCaption}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyCaption} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>{copied === "caption" ? "✓ Copied" : "Copy Caption"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, sharing && styles.buttonDisabled]}
            onPress={handleShare}
            disabled={sharing}
            accessibilityRole="button"
          >
            {sharing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>⤴ Share…</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Public Link</Text>
        <Text style={styles.linkText} numberOfLines={1}>
          {vehicle.url}
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyLink} accessibilityRole="button">
          <Text style={styles.secondaryButtonText}>{copied === "link" ? "✓ Copied" : "Copy Link"}</Text>
        </TouchableOpacity>

        <View style={styles.qrWrap}>
          <QRCode value={vehicle.url} size={140} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photos ({images.length})</Text>
        <TouchableOpacity
          style={[styles.secondaryButton, downloading && styles.buttonDisabled]}
          onPress={handleDownloadPhotos}
          disabled={downloading || images.length === 0}
          accessibilityRole="button"
        >
          {downloading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.secondaryButtonText}>Download {images.length} Photo{images.length === 1 ? "" : "s"}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Promote Listing</Text>
        <Text style={styles.promoteSubtitle}>Paid Featured placement — not available yet.</Text>
        <View style={styles.promoteRow}>
          {PROMOTE_DURATIONS.map((d) => (
            <View key={d.days} style={styles.promoteCard}>
              <Text style={styles.promoteCardLabel}>Featured</Text>
              <Text style={styles.promoteCardDays}>{d.label}</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#111827", marginTop: 4, marginBottom: 10 },

  previewImage: { width: "100%", height: 190, borderRadius: 12, backgroundColor: "#f3f4f6" },
  previewImagePlaceholder: { alignItems: "center", justifyContent: "center" },
  previewImagePlaceholderText: { color: "#9ca3af", fontWeight: "700" },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", marginTop: 12 },
  meta: { color: "#6b7280", fontSize: 13, marginTop: 4 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center" },
  chipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  chipText: { color: "#374151", fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: "#fff" },
  manualNote: { color: "#b45309", fontSize: 11, lineHeight: 16, marginTop: 10, fontWeight: "600" },

  captionInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: "#111827",
    minHeight: 160,
    backgroundColor: "#fff",
  },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  primaryButton: { flex: 1, backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  secondaryButton: { flex: 1, borderWidth: 1.5, borderColor: "#111827", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  secondaryButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },

  linkText: { color: "#1d4ed8", fontSize: 12, marginBottom: 10 },
  qrWrap: { alignItems: "center", marginTop: 16 },

  promoteSubtitle: { color: "#6b7280", fontSize: 12, marginBottom: 12 },
  promoteRow: { flexDirection: "row", gap: 8 },
  promoteCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    opacity: 0.7,
  },
  promoteCardLabel: { color: "#111827", fontWeight: "800", fontSize: 12 },
  promoteCardDays: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 4 },
  comingSoonBadge: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  comingSoonBadgeText: { color: "#6b7280", fontWeight: "800", fontSize: 9 },
});
