import { useCallback, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
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
import { SellerAuthError, sellerBiometricLogin, sellerHasBiometricEnrolled, sellerLogin } from "@/lib/marketplaceAuth";
import { promptBiometricUnlock, shouldOfferBiometricSetup } from "@/lib/biometricAuth";

export default function SellerLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      sellerHasBiometricEnrolled().then(setBiometricEnrolled);
    }, [])
  );

  function clearAll() {
    setEmail("");
    setPassword("");
    setError(null);
  }

  async function afterLoginSuccess() {
    if (await shouldOfferBiometricSetup("seller")) {
      router.replace({ pathname: "/sell/biometric-setup", params: { next: "/sell/my-listings" } });
    } else {
      router.replace("/sell/my-listings");
    }
  }

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
      await afterLoginSuccess();
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

  async function handleBiometricLogin() {
    setError(null);
    setBiometricBusy(true);
    try {
      const unlock = await promptBiometricUnlock("Sign in to your seller account");
      if (!unlock.success) {
        if (unlock.error !== "cancelled") {
          setError("Face ID / Touch ID sign-in failed. Use your password below, or use phone sign-in.");
        }
        return;
      }
      await sellerBiometricLogin();
      await afterLoginSuccess();
    } catch (err) {
      setError(
        err instanceof SellerAuthError
          ? `${err.message} Use your password below, or use phone sign-in.`
          : "Biometric sign-in failed. Use your password below, or use phone sign-in."
      );
      setBiometricEnrolled(await sellerHasBiometricEnrolled());
    } finally {
      setBiometricBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Seller Sign In</Text>
            <Text style={styles.subtitle}>Sign in to manage your Sell My Car listings.</Text>
          </View>
          {(email || password) && (
            <TouchableOpacity
              onPress={clearAll}
              accessibilityRole="button"
              accessibilityLabel="Clear all fields"
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {biometricEnrolled ? (
          <>
            <TouchableOpacity
              style={[styles.biometricButton, biometricBusy && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={biometricBusy}
              accessibilityRole="button"
            >
              {biometricBusy ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.biometricButtonText}>🔐 Sign in with Face ID / Touch ID</Text>
              )}
            </TouchableOpacity>
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
          </>
        ) : null}

        <AuthTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email"
        />
        <AuthTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
          textContentType="password"
          accessibilityLabel="Password"
        />

        <Link href="/sell/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <Link href="/sell/phone-login" style={styles.link}>
          Use phone instead →
        </Link>

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
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, marginBottom: 20, color: "#6b7280", fontSize: 13 },
  clearAllText: { color: "#6b7280", fontWeight: "700", fontSize: 12, marginTop: 4 },
  biometricButton: {
    borderWidth: 1.5,
    borderColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  biometricButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { color: "#9ca3af", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  forgotLink: { color: "#b91c1c", fontWeight: "700", fontSize: 13, textAlign: "right", marginBottom: 12, marginTop: -4 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
