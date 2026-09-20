import { useState } from "react";
import { Link, router } from "expo-router";
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
import { AdminAuthError, adminRequestOtpLogin, adminVerifyOtpLogin } from "@/lib/auth";
import { shouldOfferBiometricSetup } from "@/lib/biometricAuth";

type Step = "phone" | "code";

export default function AdminPhoneLoginScreen() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode() {
    if (!phone.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await adminRequestOtpLogin(phone.trim());
      setMessage(result);
      setStep("code");
    } catch (err) {
      setError(
        err instanceof AdminAuthError
          ? err.message
          : "Could not send a code. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!code.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminVerifyOtpLogin(phone.trim(), code.trim());
      setCode("");
      if (await shouldOfferBiometricSetup("admin")) {
        router.replace({ pathname: "/admin/biometric-setup", params: { next: "/admin" } });
      } else {
        router.replace("/admin");
      }
    } catch (err) {
      setError(
        err instanceof AdminAuthError
          ? err.message
          : "Could not verify that code. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign In with Phone</Text>
        <Text style={styles.subtitle}>
          {step === "phone"
            ? "Enter the phone number on your staff account and we'll text you a one-time code."
            : `Enter the 6-digit code sent to ${phone}.`}
        </Text>

        {step === "phone" ? (
          <AuthTextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            accessibilityLabel="Phone number"
          />
        ) : (
          <AuthTextInput
            placeholder="6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="Verification code"
          />
        )}

        {message && step === "code" ? <Text style={styles.message}>{message}</Text> : null}
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={step === "phone" ? handleSendCode : handleVerify}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{step === "phone" ? "Send Code" : "Verify & Sign In"}</Text>
          )}
        </TouchableOpacity>

        {step === "code" ? (
          <TouchableOpacity onPress={handleSendCode} disabled={submitting} accessibilityRole="button">
            <Text style={styles.resendText}>Resend code</Text>
          </TouchableOpacity>
        ) : null}

        <Link href="/admin/login" style={styles.link}>
          Use password instead →
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", justifyContent: "center", paddingHorizontal: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: "900", color: "#111827" },
  subtitle: { marginTop: 6, marginBottom: 20, color: "#6b7280", fontSize: 13, lineHeight: 19 },
  message: { color: "#15803d", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  button: { backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  resendText: { color: "#1d4ed8", fontWeight: "700", fontSize: 13, textAlign: "center", marginTop: 14 },
  link: { color: "#1d4ed8", fontWeight: "800", fontSize: 13, textAlign: "center", marginTop: 16 },
});
