import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminAuthError, adminLogin } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

export default function AdminLoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Arriving here because the dashboard's own session check failed (e.g. the
  // admin-token cookie from a prior login didn't verify) must be explained,
  // not a silent bounce back to this screen with no indication anything
  // happened.
  useEffect(() => {
    if (reason === "session_expired") {
      setError(
        "Your session could not be verified with the server. Please sign in again."
      );
    }
  }, [reason]);

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await adminLogin(email.trim(), password);
      // Never log the password or the session token — only navigate on success.
      setPassword("");
      router.replace("/admin");
    } catch (err) {
      const message =
        err instanceof AdminAuthError
          ? err.message
          : `Could not sign in. Check your connection and try again. (${
              err instanceof Error ? err.message : "unknown error"
            })`;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Admin Sign In</Text>
        <Text style={styles.subtitle}>
          Drive Prime Motors staff access only.
        </Text>
        <Text style={styles.debugHost}>Connecting to {API_BASE_URL}</Text>

        <TextInput
          style={styles.input}
          placeholder="Admin email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, color: "#6b7280", fontSize: 13 },
  debugHost: { marginTop: 4, marginBottom: 16, color: "#9ca3af", fontSize: 11 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
