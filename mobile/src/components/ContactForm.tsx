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
}: {
  carId?: string;
  carTitle?: string;
}) {
  const defaultMessage = carTitle ? `I'm interested in the ${carTitle}.` : "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setStatus("error");
      return;
    }

    setSubmitting(true);
    setStatus("idle");

    try {
      await submitContactLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        carId,
      });
      setStatus("success");
      setName("");
      setPhone("");
      setEmail("");
      setMessage(defaultMessage);
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "success") {
    return (
      <View style={styles.container}>
        <Text style={styles.successText}>
          Thanks — we received your message and will contact you shortly.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contact About This Vehicle</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Email (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />

      {status === "error" && (
        <Text style={styles.errorText}>
          Please enter your name and phone number, then try again.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Message</Text>
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
  heading: { fontSize: 16, fontWeight: "800", marginBottom: 12, color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  messageInput: { minHeight: 80, textAlignVertical: "top" },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  successText: { color: "#15803d", fontWeight: "600", textAlign: "center" },
  errorText: { color: "#dc2626", marginBottom: 10, fontSize: 13 },
});
