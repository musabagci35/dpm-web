import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ContactForm from "@/components/ContactForm";
import { fetchVehicle, VehicleDetail } from "@/lib/api";
import { formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

const DEALER_PHONE = "+19162618880";
const DEALER_PHONE_DISPLAY = "(916) 261-8880";

export default function VehicleDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

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
    } catch {
      setError("Could not load this vehicle. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  function callDealer() {
    Linking.openURL(`tel:${DEALER_PHONE}`);
  }

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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={load}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (notFound || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          This vehicle could not be found. It may have been sold or removed.
        </Text>
      </View>
    );
  }

  const title = vehicleTitle(vehicle);
  const isSold = vehicle.status === "sold";
  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
  const screenWidth = Dimensions.get("window").width;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {images.length > 0 ? (
        <>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / screenWidth
              );
              setActiveImage(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.url }}
                style={{ width: screenWidth, height: 260 }}
                resizeMode="cover"
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeImage && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>Photo Not Available</Text>
        </View>
      )}

      <View style={styles.body}>
        {isSold && (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>Sold</Text>
          </View>
        )}

        <Text style={styles.title}>{title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>{formatMileage(vehicle.mileage)}</Text>
        </View>

        <Text style={styles.price}>{formatPrice(vehicle.price)}</Text>

        {!isSold && (
          <TouchableOpacity style={styles.callButton} onPress={callDealer}>
            <Text style={styles.callButtonText}>Call {DEALER_PHONE_DISPLAY}</Text>
          </TouchableOpacity>
        )}

        {vehicle.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Description</Text>
            <Text style={styles.description}>{vehicle.description}</Text>
          </View>
        ) : null}

        {isSold ? (
          <View style={styles.soldNotice}>
            <Text style={styles.soldNoticeText}>
              This vehicle has been sold. Browse current inventory for similar
              options.
            </Text>
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
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: { color: "#6b7280", fontSize: 15, textAlign: "center" },
  retryButton: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  noImage: {
    height: 260,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: { color: "#9ca3af", fontWeight: "700" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotActive: { backgroundColor: "#dc2626" },
  body: { padding: 16 },
  soldBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  soldBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },
  metaItem: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  price: { fontSize: 26, fontWeight: "900", color: "#dc2626", marginTop: 12 },
  callButton: {
    backgroundColor: "#b91c1c",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  callButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  section: { marginTop: 20 },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  description: { fontSize: 14, color: "#374151", lineHeight: 20 },
  soldNotice: {
    marginTop: 20,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
  },
  soldNoticeText: { color: "#fff", fontSize: 14 },
});
