import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import {
  coverImageUrl,
  formatMileage,
  formatPrice,
  formatSoldDate,
  titleStatusLabel,
  vehicleTitle,
} from "@/lib/format";

type CardVehicle = {
  _id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  mileage?: number;
  status?: string;
  images?: { url: string; isCover?: boolean }[];
  engine?: string;
  transmission?: string;
  drivetrain?: string;
  fuelType?: string;
  titleStatus?: string;
  soldAt?: string;
  vehicleHistoryReport?: { url: string; source: string; reportDate: string | null } | null;
};

export default function VehicleCard({
  vehicle,
  sold = false,
}: {
  vehicle: CardVehicle;
  sold?: boolean;
}) {
  const title = vehicleTitle(vehicle);
  const image = coverImageUrl(vehicle.images);
  const isSold = sold || vehicle.status === "sold";
  const photoCount = vehicle.images?.length ?? 0;

  // Only the specs that actually exist become chips — a chip is never a
  // placeholder for a value we don't have.
  const chips = [
    vehicle.drivetrain,
    vehicle.transmission,
    vehicle.fuelType,
    titleStatusLabel(vehicle.titleStatus),
  ].filter((chip): chip is string => Boolean(chip && chip.trim()));

  const soldDate = isSold ? formatSoldDate(vehicle.soldAt) : null;

  return (
    <Link href={`/vehicle/${encodeURIComponent(vehicle.slug)}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="link"
        accessibilityLabel={`${title}. ${
          isSold ? "Sold." : formatPrice(vehicle.price)
        } View details.`}
      >
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Text style={styles.noImageText}>Photo coming soon</Text>
            </View>
          )}

          {isSold ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Sold</Text>
            </View>
          ) : vehicle.status === "pending" ? (
            <View style={[styles.badge, styles.pendingBadge]}>
              <Text style={styles.badgeText}>Sale Pending</Text>
            </View>
          ) : null}

          {photoCount > 1 ? (
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{photoCount} photos</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatMileage(vehicle.mileage)}</Text>
            {soldDate ? (
              <Text style={styles.meta}>· Sold {soldDate}</Text>
            ) : null}
          </View>

          {chips.length > 0 ? (
            <View style={styles.chips}>
              {chips.slice(0, 3).map((chip) => (
                <View key={chip} style={styles.chip}>
                  <Text style={styles.chipText} numberOfLines={1}>
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {vehicle.vehicleHistoryReport?.url ? (
            <View style={styles.reportChip}>
              <Text style={styles.reportChipText}>
                {vehicle.vehicleHistoryReport.source === "carfax" ? "✓ CARFAX Report" : "✓ History Report"}
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            {isSold ? (
              <Text style={styles.soldLabel}>No longer available</Text>
            ) : (
              <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>
            )}

            <View style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>View Details</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  cardPressed: { opacity: 0.85 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 190, backgroundColor: "#f3f4f6" },
  noImage: { alignItems: "center", justifyContent: "center" },
  noImageText: { color: "#9ca3af", fontWeight: "700", fontSize: 13 },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#dc2626",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  pendingBadge: { backgroundColor: "#b45309" },
  photoCount: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(17,24,39,0.78)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  photoCountText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827", lineHeight: 21 },
  metaRow: { flexDirection: "row", gap: 5, marginTop: 5, flexWrap: "wrap" },
  meta: { fontSize: 13, color: "#6b7280" },
  chips: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  chip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  chipText: { fontSize: 11, color: "#374151", fontWeight: "700" },
  reportChip: { alignSelf: "flex-start", marginTop: 8 },
  reportChipText: { fontSize: 11, color: "#15803d", fontWeight: "800" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },
  price: { fontSize: 20, fontWeight: "900", color: "#dc2626" },
  soldLabel: { fontSize: 13, fontWeight: "700", color: "#6b7280" },
  detailsButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  detailsButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
