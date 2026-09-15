import { useCallback, useEffect, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AdminUser, adminLogout, verifyAdminSession } from "@/lib/auth";

export default function AdminHomeScreen() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    const session = await verifyAdminSession();

    if (!session) {
      router.replace("/admin/login");
      return;
    }

    setUser(session);
    setChecking(false);
  }, []);

  // Re-verify every time this screen gains focus, not just on first mount —
  // catches a session that expired or was revoked while the app was open.
  useFocusEffect(
    useCallback(() => {
      check();
    }, [check])
  );

  async function handleLogout() {
    setLoggingOut(true);
    await adminLogout();
    router.replace("/admin/login");
  }

  if (checking || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user.name || user.email}</Text>
      <Text style={styles.role}>Signed in as {user.role}</Text>

      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>
          Admin tools (VIN entry, photo capture, AI description, create/edit
          vehicles, status changes) will be added here next.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logoutText}>Log Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 20 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  welcome: { fontSize: 22, fontWeight: "900", color: "#111827", marginTop: 12 },
  role: { marginTop: 4, color: "#6b7280", fontSize: 13, textTransform: "capitalize" },
  placeholderBox: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 18,
  },
  placeholderText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
