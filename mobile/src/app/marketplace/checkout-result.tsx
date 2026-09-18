import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * The Stripe Checkout success/cancel redirect target. In the normal flow
 * WebBrowser.openAuthSessionAsync already captures this URL directly in JS
 * without the OS ever opening the app here — this screen exists as a
 * fallback for cases where the redirect does land as a real deep link
 * (e.g. the browser session was dismissed and the user reopens the app).
 */
export default function CheckoutResultScreen() {
  const { status, listingId, type } = useLocalSearchParams<{
    status?: string;
    listingId?: string;
    type?: string;
  }>();

  const success = status === "success";
  const isFeatured = type === "featured";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>{success ? "Payment received" : "Checkout cancelled"}</Text>
        <Text style={styles.text}>
          {success
            ? isFeatured
              ? "Your featured upgrade is being confirmed. This can take a few seconds."
              : "Your listing fee is being confirmed and your listing will move to admin review shortly."
            : "No charge was made. You can try again from your listing."}
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            listingId ? router.replace(`/sell/listing/${listingId}`) : router.replace("/sell/my-listings")
          }
        >
          <Text style={styles.buttonText}>
            {listingId ? "View Listing" : "My Listings"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  heading: { fontSize: 22, fontWeight: "900", color: "#111827" },
  text: { color: "#6b7280", fontSize: 14, lineHeight: 20, marginTop: 10 },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
