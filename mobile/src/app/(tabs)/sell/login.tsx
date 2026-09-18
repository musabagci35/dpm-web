import { useState } from "react";
import { Link, router } from "expo-router";
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

import { SellerAuthError, sellerLogin } from "@/lib/marketplaceAuth";

export default function SellerLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await sellerLogin(email.trim(), password);
      setPassword("");
      router.replace("/sell/my-listings");
    } catch (err) {
      setError(
        err instanceof SellerAuthError
          ? err.message
          : "Could not sign in. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Seller Sign In</Text>
        <Text style={styles.subtitle}>Sign in to manage your Sell My Car listings.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
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

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <Link href="/sell/register" style={styles.link}>
          Don&apos;t have an account? Create one →
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#6b7280", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
