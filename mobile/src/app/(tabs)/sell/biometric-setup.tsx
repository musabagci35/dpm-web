import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { sellerEnrollBiometric } from "@/lib/marketplaceAuth";
import { markAskedAboutBiometric, promptBiometricUnlock } from "@/lib/biometricAuth";

/**
 * Only ever reached right after one real, already-completed email/password
 * or phone/OTP login (see login.tsx / phone-login.tsx) — never offered as
 * a way to sign in for the first time.
 */
export default function SellerBiometricSetupScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goNext() {
    router.replace((next as any) || "/sell/my-listings");
  }

  async function handleEnable() {
    setError(null);
    setBusy(true);
    try {
      const unlock = await promptBiometricUnlock("Confirm to enable Face ID / Touch ID sign-in");
      if (!unlock.success) {
        setError(
          unlock.error === "not_enrolled"
            ? "No Face ID or Touch ID is set up on this device yet."
            : unlock.error === "no_hardware"
              ? "This device doesn't support Face ID or Touch ID."
              : "Could not confirm biometrics. You can try again or skip for now."
        );
        return;
      }
      await sellerEnrollBiometric();
      await markAskedAboutBiometric("seller");
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable biometric sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    await markAskedAboutBiometric("seller");
    goNext();
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Enable Face ID / Touch ID?</Text>
        <Text style={styles.subtitle}>
          Sign in faster next time. Your password is never stored on this device — only a
          secure, device-bound key that unlocks with your biometrics.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, busy && styles.buttonDisabled]} onPress={handleEnable} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enable Face ID / Touch ID</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} disabled={busy} accessibilityRole="button">
          <Text style={styles.skipText}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, alignItems: "center" },
  icon: { fontSize: 40, marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  subtitle: { marginTop: 10, marginBottom: 20, color: "#6b7280", fontSize: 13, lineHeight: 19, textAlign: "center" },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 14, fontWeight: "600", textAlign: "center" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", width: "100%" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  skipText: { color: "#6b7280", fontWeight: "700", fontSize: 13, marginTop: 16 },
});
