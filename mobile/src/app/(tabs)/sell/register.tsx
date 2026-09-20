import { useState } from "react";
import { Link, router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AuthTextInput from "@/components/shared/AuthTextInput";
import { SellerAuthError, sellerRegister } from "@/lib/marketplaceAuth";

export default function SellerRegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearAll() {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await sellerRegister({
        email: email.trim(),
        password,
        confirmPassword,
        name: name.trim(),
        phone: phone.trim(),
      });
      setPassword("");
      setConfirmPassword("");
      router.replace("/sell/new");
    } catch (err) {
      setError(
        err instanceof SellerAuthError
          ? err.message
          : "Could not create your account. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Create Seller Account</Text>
              <Text style={styles.subtitle}>List your own vehicle for sale on Drive Prime Motors.</Text>
            </View>
            {(name || email || phone || password || confirmPassword) && (
              <TouchableOpacity onPress={clearAll} accessibilityRole="button" accessibilityLabel="Clear all fields">
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <AuthTextInput placeholder="Your name" value={name} onChangeText={setName} accessibilityLabel="Name" />
          <AuthTextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel="Email"
          />
          <AuthTextInput
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            accessibilityLabel="Phone"
          />
          <AuthTextInput
            placeholder="Password (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            isPassword
            textContentType="newPassword"
            accessibilityLabel="Password"
          />
          <AuthTextInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
            textContentType="newPassword"
            accessibilityLabel="Confirm password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <Link href="/sell/login" style={styles.link}>
            Already have an account? Sign in →
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 40 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#6b7280", fontSize: 13 },
  clearAllText: { color: "#6b7280", fontWeight: "700", fontSize: 12, marginTop: 4 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
