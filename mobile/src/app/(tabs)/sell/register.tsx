import { useState } from "react";
import { Link, router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SellerAuthError, sellerRegister } from "@/lib/marketplaceAuth";

export default function SellerRegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setSubmitting(true);
    try {
      await sellerRegister({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
      setPassword("");
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Seller Account</Text>
          <Text style={styles.subtitle}>List your own vehicle for sale on Drive Prime Motors.</Text>

          <TextInput style={styles.input} placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" />
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
          <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput
            style={styles.input}
            placeholder="Password (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
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
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#6b7280", fontSize: 13 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
