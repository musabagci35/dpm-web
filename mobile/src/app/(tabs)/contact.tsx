import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import ContactForm from "@/components/ContactForm";
import {
  DEALER_EMAIL,
  DEALER_HOURS,
  DEALER_LOCATION,
  DEALER_PHONE,
  DEALER_PHONE_DISPLAY,
} from "@/lib/constants";

export default function ContactScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Get In Touch</Text>
        <Text style={styles.subheading}>
          Questions about a vehicle, financing, or a trade-in? Reach us
          directly or send a message below.
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => Linking.openURL(`tel:${DEALER_PHONE}`)}
          accessibilityRole="button"
        >
          <Text style={styles.actionButtonText}>Call {DEALER_PHONE_DISPLAY}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => Linking.openURL(`mailto:${DEALER_EMAIL}`)}
          accessibilityRole="button"
        >
          <Text style={styles.emailButtonText}>Email Us</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location &amp; hours</Text>
        <Text style={styles.cardLine}>{DEALER_LOCATION}</Text>
        {DEALER_HOURS.map((line) => (
          <Text key={line} style={styles.cardLine}>
            {line}
          </Text>
        ))}
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${DEALER_EMAIL}`)}>
          <Text style={styles.cardEmail}>{DEALER_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <ContactForm
        heading="Send Us a Message"
        intro="Tell us what you're looking for and we'll get back to you."
        submitLabel="Send Message"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 18,
  },
  heading: { color: "#fff", fontSize: 22, fontWeight: "900" },
  subheading: { color: "#d1d5db", fontSize: 13, lineHeight: 19, marginTop: 8 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  callButton: { backgroundColor: "#dc2626" },
  actionButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  emailButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#111827",
  },
  emailButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },

  card: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 18,
  },
  cardTitle: { color: "#111827", fontWeight: "900", fontSize: 16, marginBottom: 8 },
  cardLine: { color: "#374151", fontSize: 13, lineHeight: 20 },
  cardEmail: { color: "#b91c1c", fontWeight: "800", fontSize: 13, marginTop: 8 },
});
