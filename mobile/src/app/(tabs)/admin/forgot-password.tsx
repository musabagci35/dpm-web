import { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AuthTextInput from "@/components/shared/AuthTextInput";
import { adminForgotPassword } from "@/lib/auth";

export default function AdminForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await adminForgotPassword(email.trim());
      setMessage(result);
    } catch {
      setMessage("If an account exists for that email, a password reset link has been sent.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your staff admin email and we&apos;ll send a link to reset your password.
        </Text>

        <AuthTextInput
          placeholder="Admin email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Admin email"
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (submitting || !email.trim()) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !email.trim()}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backLink}>← Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, marginBottom: 20, color: "#6b7280", fontSize: 13, lineHeight: 19 },
  message: { color: "#15803d", fontSize: 13, marginBottom: 14, fontWeight: "600", lineHeight: 18 },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  backLink: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 18 },
});
