import { useState } from "react";
import { router } from "expo-router";
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

import { sellerDeleteAccount, SellerAuthError } from "@/lib/marketplaceAuth";

const CONFIRM_PHRASE = "DELETE";

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length > 0 && confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await sellerDeleteAccount(password);
      router.replace("/sell");
    } catch (err) {
      setError(err instanceof SellerAuthError ? err.message : "Could not delete your account.");
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Delete your account</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>This can&apos;t be undone</Text>
          <Text style={styles.warningItem}>• Your account will be permanently deactivated and your personal information removed.</Text>
          <Text style={styles.warningItem}>• Every listing and auction you own will be immediately hidden from the public marketplace.</Text>
          <Text style={styles.warningItem}>• You&apos;ll be signed out of this device and every other device.</Text>
          <Text style={styles.warningItem}>• Face ID / Touch ID sign-in will be disabled.</Text>
          <Text style={styles.warningItem}>• Existing messages, payments, and records stay on file for our own accounting and legal requirements, but are no longer tied to an active account you control.</Text>
        </View>

        <Text style={styles.label}>Type DELETE to confirm</Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="DELETE"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.label}>Enter your password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.deleteButton, !canSubmit && styles.deleteButtonDisabled]}
          disabled={!canSubmit || submitting}
          onPress={handleDelete}
          accessibilityRole="button"
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>Permanently Delete My Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} disabled={submitting} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 60 },
  heading: { fontSize: 22, fontWeight: "900", color: "#111827", marginBottom: 16 },

  warningBox: { backgroundColor: "#fff7f7", borderWidth: 1, borderColor: "#fecaca", borderRadius: 16, padding: 16, marginBottom: 24 },
  warningTitle: { color: "#991b1b", fontWeight: "900", fontSize: 15, marginBottom: 8 },
  warningItem: { color: "#7f1d1d", fontSize: 13, lineHeight: 19, marginTop: 4 },

  label: { color: "#374151", fontWeight: "800", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  error: { color: "#b91c1c", fontSize: 13, fontWeight: "700", marginTop: 14 },

  deleteButton: { backgroundColor: "#b91c1c", borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  deleteButtonDisabled: { opacity: 0.4 },
  deleteButtonText: { color: "#fff", fontWeight: "900", fontSize: 15 },

  cancelButton: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  cancelButtonText: { color: "#6b7280", fontWeight: "700", fontSize: 14 },
});
