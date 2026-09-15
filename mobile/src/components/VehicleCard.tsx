import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import { coverImageUrl, formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

type CardVehicle = {
  _id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  mileage?: number;
  images?: { url: string; isCover?: boolean }[];
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

  return (
    <Link
      href={`/vehicle/${encodeURIComponent(vehicle.slug)}`}
      asChild
    >
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Text style={styles.noImageText}>Photo Not Available</Text>
            </View>
          )}
          {sold && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Sold</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{formatMileage(vehicle.mileage)}</Text>
          {!sold && <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>}
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
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 180, backgroundColor: "#f3f4f6" },
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
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#6b7280" },
  price: { marginTop: 8, fontSize: 18, fontWeight: "900", color: "#dc2626" },
});
