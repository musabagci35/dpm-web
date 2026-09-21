import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SellerUser, sellerLogout, sellerLogoutAll, verifySellerSession } from "@/lib/marketplaceAuth";

export default function SellerAccountScreen() {
  const [checking, setChecking] = useState(true);
  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setChecking(true);
      verifySellerSession().then((user) => {
        if (cancelled) return;
        setSeller(user);
        setChecking(false);
        if (!user) router.replace("/sell/login");
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  async function handleLogout() {
    setBusy(true);
    await sellerLogout();
    setBusy(false);
    router.replace("/sell");
  }

  function confirmLogoutAll() {
    Alert.alert(
      "Log out everywhere",
      "This signs out every device and disables Face ID / Touch ID sign-in until you enable it again. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out Everywhere", style: "destructive", onPress: handleLogoutAll },
      ]
    );
  }

  async function handleLogoutAll() {
    setBusy(true);
    await sellerLogoutAll();
    setBusy(false);
    router.replace("/sell");
  }

  if (checking || !seller) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.cardValue}>{seller.name || seller.email}</Text>
        {seller.name ? <Text style={styles.cardSubvalue}>{seller.email}</Text> : null}
      </View>

      <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={handleLogout}>
        <Text style={styles.secondaryButtonText}>Log Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} disabled={busy} onPress={confirmLogoutAll}>
        <Text style={styles.secondaryButtonText}>Log Out Everywhere</Text>
      </TouchableOpacity>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerHeading}>Danger Zone</Text>
        <Text style={styles.dangerText}>
          Permanently delete your account. This can&apos;t be undone.
        </Text>
        <TouchableOpacity
          style={styles.dangerButton}
          disabled={busy}
          onPress={() => router.push("/sell/delete-account")}
          accessibilityRole="button"
        >
          <Text style={styles.dangerButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 18, marginBottom: 20 },
  cardLabel: { color: "#9ca3af", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  cardValue: { color: "#111827", fontSize: 18, fontWeight: "900", marginTop: 4 },
  cardSubvalue: { color: "#6b7280", fontSize: 13, marginTop: 2 },

  secondaryButton: { borderWidth: 1, borderColor: "#374151", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  secondaryButtonText: { color: "#111827", fontWeight: "800", fontSize: 14 },

  dangerZone: { marginTop: 26, borderWidth: 1, borderColor: "#fecaca", borderRadius: 16, padding: 18, backgroundColor: "#fff7f7" },
  dangerHeading: { color: "#991b1b", fontWeight: "900", fontSize: 14 },
  dangerText: { color: "#7f1d1d", fontSize: 13, lineHeight: 19, marginTop: 6 },
  dangerButton: { backgroundColor: "#b91c1c", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  dangerButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
