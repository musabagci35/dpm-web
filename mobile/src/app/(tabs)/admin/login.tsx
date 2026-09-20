import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams, Link } from "expo-router";
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
import { AdminAuthError, adminBiometricLogin, adminHasBiometricEnrolled, adminLogin } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { promptBiometricUnlock, shouldOfferBiometricSetup } from "@/lib/biometricAuth";

export default function AdminLoginScreen() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      adminHasBiometricEnrolled().then(setBiometricEnrolled);
    }, [])
  );

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

  function clearAll() {
    setEmail("");
    setPassword("");
    setError(null);
  }

  async function afterLoginSuccess() {
    if (await shouldOfferBiometricSetup("admin")) {
      router.replace({ pathname: "/admin/biometric-setup", params: { next: "/admin" } });
    } else {
      router.replace("/admin");
    }
  }

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
      await afterLoginSuccess();
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

  async function handleBiometricLogin() {
    setError(null);
    setBiometricBusy(true);
    try {
      const unlock = await promptBiometricUnlock("Sign in to Drive Prime Motors admin");
      if (!unlock.success) {
        if (unlock.error !== "cancelled") {
          setError("Face ID / Touch ID sign-in failed. Use your password below, or use phone sign-in.");
        }
        return;
      }
      await adminBiometricLogin();
      await afterLoginSuccess();
    } catch (err) {
      setError(
        err instanceof AdminAuthError
          ? `${err.message} Use your password below, or use phone sign-in.`
          : "Biometric sign-in failed. Use your password below, or use phone sign-in."
      );
      setBiometricEnrolled(await adminHasBiometricEnrolled());
    } finally {
      setBiometricBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Admin Sign In</Text>
            <Text style={styles.subtitle}>Drive Prime Motors staff access only.</Text>
          </View>
          {(email || password) && (
            <TouchableOpacity onPress={clearAll} accessibilityRole="button" accessibilityLabel="Clear all fields">
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.debugHost}>Connecting to {API_BASE_URL}</Text>

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
          placeholder="Admin email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Admin email"
        />

        <AuthTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
          textContentType="password"
          accessibilityLabel="Password"
        />

        <Link href="/admin/forgot-password" style={styles.forgotLink}>
          Forgot password?
        </Link>

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

        <Link href="/admin/phone-login" style={styles.link}>
          Use phone instead →
        </Link>
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
  headerRow: { flexDirection: "row", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 4, color: "#6b7280", fontSize: 13 },
  clearAllText: { color: "#6b7280", fontWeight: "700", fontSize: 12, marginTop: 4 },
  debugHost: { marginTop: 4, marginBottom: 16, color: "#9ca3af", fontSize: 11 },
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
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
