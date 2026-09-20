import { useCallback, useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
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

import ContactForm from "@/components/ContactForm";
import VehicleHistoryReportButton from "@/components/shared/VehicleHistoryReportButton";
import { fetchVehicle, VehicleDetail } from "@/lib/api";
import { DEALER_PHONE, DEALER_PHONE_DISPLAY } from "@/lib/constants";
import {
  formatMileage,
  formatPrice,
  formatSoldDate,
  titleStatusLabel,
  vehicleTitle,
} from "@/lib/format";

export default function VehicleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  // A hook rather than Dimensions.get(): it re-renders on rotation and keeps
  // the static web render and the hydrated client in agreement.
  const { width: screenWidth } = useWindowDimensions();

  const load = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await fetchVehicle(slug);
      if (data) {
        setVehicle(data);
      } else {
        setNotFound(true);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load this vehicle. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this vehicle</Text>
        <Text style={styles.centeredText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notFound || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>This listing isn&apos;t available</Text>
        <Text style={styles.centeredText}>
          It may have been sold or removed from our inventory.
        </Text>
        <Link href="/inventory" style={styles.centeredLink}>
          Browse current inventory →
        </Link>
      </View>
    );
  }

  const title = vehicleTitle(vehicle);
  const isSold = vehicle.status === "sold";
  const isPending = vehicle.status === "pending";
  const images = vehicle.images ?? [];
  const soldDate = formatSoldDate(vehicle.soldAt);

  // Only specs with a real value are listed — no "N/A" filler rows.
  const specs = [
    ["Engine", vehicle.engine],
    ["Transmission", vehicle.transmission],
    ["Drivetrain", vehicle.drivetrain],
    ["Fuel type", vehicle.fuelType],
    ["Body style", vehicle.bodyClass],
    ["Title", titleStatusLabel(vehicle.titleStatus)],
    ["Location", vehicle.location],
    ["VIN (last 6)", vehicle.vinLast6],
  ].filter(([, value]) => Boolean(value && String(value).trim())) as [
    string,
    string
  ][];

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
            onMomentumScrollEnd={(e) => {
              setActiveImage(
                Math.round(e.nativeEvent.contentOffset.x / screenWidth)
              );
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{ width: screenWidth, height: 260 }}
                resizeMode="cover"
              />
            )}
          />
          {images.length > 1 ? (
            <View style={styles.imageFooter}>
              <View style={styles.dots}>
                {images.map((image, i) => (
                  <View
                    key={`${image.url}-dot-${i}`}
                    style={[styles.dot, i === activeImage && styles.dotActive]}
                  />
                ))}
              </View>
              <Text style={styles.imageCount}>
                {activeImage + 1} of {images.length}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Photos coming soon</Text>
        </View>
      )}

      <View style={styles.body}>
        {isSold || isPending ? (
          <View style={[styles.statusBadge, isPending && styles.pendingBadge]}>
            <Text style={styles.statusBadgeText}>
              {isSold ? "Sold" : "Sale Pending"}
            </Text>
          </View>
        ) : null}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>{formatMileage(vehicle.mileage)}</Text>
          {soldDate ? (
            <Text style={styles.metaItem}>Sold {soldDate}</Text>
          ) : null}
        </View>

        {!isSold ? (
          <>
            <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
              accessibilityRole="button"
            >
              <Text style={styles.callButtonText}>
                Call {DEALER_PHONE_DISPLAY}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.reportSection}>
          <VehicleHistoryReportButton
            report={vehicle.vehicleHistoryReport}
            onRequestReport={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
          />
        </View>

        {specs.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Specifications</Text>
            <View style={styles.specTable}>
              {specs.map(([label, value], index) => (
                <View
                  key={label}
                  style={[styles.specRow, index === 0 && styles.specRowFirst]}
                >
                  <Text style={styles.specLabel}>{label}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
            {vehicle.specsSource === "vin-decode" ? (
              <Text style={styles.specNote}>
                Specifications not recorded by our team are filled in from this
                vehicle&apos;s factory VIN decode (NHTSA).
              </Text>
            ) : null}
          </View>
        ) : null}

        {vehicle.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.description}>{vehicle.description}</Text>
          </View>
        ) : null}

        {vehicle.videoUrl ? (
          <TouchableOpacity
            style={styles.videoButton}
            onPress={() => Linking.openURL(vehicle.videoUrl as string)}
            accessibilityRole="button"
          >
            <Text style={styles.videoButtonText}>Watch vehicle video</Text>
          </TouchableOpacity>
        ) : null}

        {isSold ? (
          <View style={styles.soldNotice}>
            <Text style={styles.soldNoticeHeading}>This vehicle is sold</Text>
            <Text style={styles.soldNoticeText}>
              It&apos;s shown for reference only and is no longer available.
              Similar vehicles come through regularly.
            </Text>
            <Link href="/inventory" style={styles.soldNoticeLink}>
              Browse current inventory →
            </Link>
          </View>
        ) : (
          <ContactForm carId={vehicle._id} carTitle={title} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { paddingBottom: 40 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 28,
  },
  centeredHeading: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  centeredText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  centeredLink: { color: "#b91c1c", fontWeight: "900", fontSize: 14, marginTop: 18 },
  primaryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  noImage: {
    height: 260,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#9ca3af", fontWeight: "700" },
  imageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: "#dc2626" },
  imageCount: { color: "#6b7280", fontSize: 12, fontWeight: "700" },

  body: { padding: 16 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  statusBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  pendingBadge: { backgroundColor: "#b45309" },
  title: { fontSize: 22, fontWeight: "900", color: "#111827", lineHeight: 28 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  metaItem: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: "#374151",
    fontWeight: "700",
  },
  price: { fontSize: 26, fontWeight: "900", color: "#dc2626", marginTop: 14 },
  callButton: {
    backgroundColor: "#b91c1c",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 14,
  },
  callButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  reportSection: { marginTop: 14 },

  section: { marginTop: 24 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  specTable: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  specRowFirst: { borderTopWidth: 0 },
  specLabel: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  specValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  specNote: { color: "#9ca3af", fontSize: 11, lineHeight: 16, marginTop: 8 },

  description: { fontSize: 14, color: "#374151", lineHeight: 21 },

  videoButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  videoButtonText: { color: "#b91c1c", fontWeight: "800" },

  soldNotice: {
    marginTop: 24,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 18,
  },
  soldNoticeHeading: { color: "#fff", fontSize: 16, fontWeight: "900" },
  soldNoticeText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  soldNoticeLink: { color: "#fca5a5", fontWeight: "900", fontSize: 14, marginTop: 14 },
});
