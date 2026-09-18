import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { submitContactLead } from "@/lib/api";

export default function ContactForm({
  carId,
  carTitle,
  vin,
  heading = "Contact About This Vehicle",
  intro,
  submitLabel = "Send Message",
}: {
  carId?: string;
  carTitle?: string;
  /** Present when the request is for a VIN that isn't in inventory. */
  vin?: string;
  heading?: string;
  intro?: string;
  submitLabel?: string;
}) {
  const defaultMessage = vin
    ? `I'd like to know if you can source this vehicle${
        carTitle ? `: ${carTitle}` : ""
      } (VIN ${vin}).`
    : carTitle
    ? `I'm interested in the ${carTitle}.`
    : "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitContactLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        carId,
        vin,
        carTitle,
        source: vin ? "vin" : "inventory",
      });
      setStatus("success");
      setName("");
      setPhone("");
      setEmail("");
      setMessage(defaultMessage);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your message could not be sent. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <Text style={styles.successHeading}>Request received</Text>
        <Text style={styles.successText}>
          Thanks — your request is with our team and we&apos;ll contact you
          shortly at the number you provided.
        </Text>
        <TouchableOpacity
          style={styles.againButton}
          onPress={() => setStatus("idle")}
        >
          <Text style={styles.againButtonText}>Send another message</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{heading}</Text>
      {intro ? <Text style={styles.intro}>{intro}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Your name"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        placeholderTextColor="#9ca3af"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (optional)"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message"
        placeholderTextColor="#9ca3af"
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        accessibilityRole="button"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginTop: 16,
  },
  heading: { fontSize: 16, fontWeight: "800", color: "#111827" },
  intro: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  messageInput: { minHeight: 84, textAlignVertical: "top" },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  errorText: { color: "#dc2626", marginTop: 10, fontSize: 13, fontWeight: "600" },
  successContainer: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  successHeading: { color: "#166534", fontWeight: "900", fontSize: 16 },
  successText: { color: "#166534", marginTop: 6, fontSize: 14, lineHeight: 20 },
  againButton: { marginTop: 14 },
  againButtonText: { color: "#166534", fontWeight: "800", fontSize: 14 },
});
