import { useCallback, useMemo, useState } from "react";
import { Link, router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteAdminCar,
  fetchAdminInventory,
  updateAdminCar,
  VehicleSummary,
} from "@/lib/api";
import {
  AdminUser,
  adminLogout,
  adminLogoutAll,
  getStoredAdminSession,
  verifyAdminSession,
} from "@/lib/auth";
import { formatMileage, formatPrice, vehicleTitle } from "@/lib/format";

type Status = "available" | "pending" | "sold" | "archived";

export default function AdminDashboardScreen() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [cars, setCars] = useState<VehicleSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCars = useCallback(async () => {
    const data = await fetchAdminInventory();
    setCars(data);
  }, []);

  const check = useCallback(async () => {
    setChecking(true);
    // A stored session that fails to verify server-side is a surprising
    // case (usually the admin-token cookie from login didn't carry over) —
    // worth telling the user, rather than bouncing them back to a blank
    // login screen with no explanation. Never having signed in at all is
    // the ordinary case and needs no explanation.
    const hadStoredSession = Boolean(await getStoredAdminSession());
    const session = await verifyAdminSession();

    if (!session) {
      router.replace(
        hadStoredSession
          ? { pathname: "/admin/login", params: { reason: "session_expired" } }
          : "/admin/login"
      );
      return;
    }

    setUser(session);
    setChecking(false);

    try {
      setError(null);
      await loadCars();
    } catch {
      setError("Could not load inventory. Check your connection and try again.");
    }
  }, [loadCars]);

  useFocusEffect(
    useCallback(() => {
      check();
    }, [check])
  );

  const counts = useMemo(
    () => ({
      available: cars.filter((car) => car.status === "available").length,
      pending: cars.filter((car) => car.status === "pending").length,
      sold: cars.filter((car) => car.status === "sold").length,
      archived: cars.filter((car) => car.status === "archived").length,
    }),
    [cars]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      setError(null);
      await loadCars();
    } catch {
      setError("Could not load inventory. Check your connection and try again.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStatusChange(car: VehicleSummary, status: Status) {
    if (!car._id || car.status === status) return;
    setError(null);
    setMessage(null);
    setBusyId(car._id);

    try {
      const updated = await updateAdminCar(car._id, { status });
      setCars((current) =>
        current.map((item) => (item._id === updated._id ? updated : item))
      );
      setMessage(`${vehicleTitle(car)} is now ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmDelete(car: VehicleSummary) {
    Alert.alert(
      "Delete vehicle",
      `Permanently delete ${vehicleTitle(car)} from the live inventory? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(car),
        },
      ]
    );
  }

  async function handleDelete(car: VehicleSummary) {
    if (!car._id) return;
    setError(null);
    setMessage(null);
    setBusyId(car._id);

    try {
      await deleteAdminCar(car._id);
      setCars((current) => current.filter((item) => item._id !== car._id));
      setMessage(`${vehicleTitle(car)} was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete vehicle.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    await adminLogout();
    router.replace("/admin/login");
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
    await adminLogoutAll();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.welcome}>Welcome, {user.name || user.email}</Text>
      <Text style={styles.role}>Signed in as {user.role}</Text>

      <View style={styles.statsRow}>
        <Stat label="Available" value={counts.available} color="#15803d" />
        <Stat label="Pending" value={counts.pending} color="#b45309" />
        <Stat label="Sold" value={counts.sold} color="#b91c1c" />
        <Stat label="Archived" value={counts.archived} color="#6b7280" />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/admin/add-vehicle")}
        >
          <Text style={styles.primaryButtonText}>+ Add Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/admin/leads")}
        >
          <Text style={styles.secondaryButtonText}>View Leads</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.marketplaceButton}
        onPress={() => router.push("/admin/marketplace-listings")}
      >
        <Text style={styles.marketplaceButtonText}>Marketplace Moderation — Review Seller Listings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.marketplaceButton}
        onPress={() => router.push("/admin/auction-listings")}
      >
        <Text style={styles.marketplaceButtonText}>Auction Moderation — Review Seller Auctions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.marketplaceButton}
        onPress={() => router.push("/admin/sellers")}
      >
        <Text style={styles.marketplaceButtonText}>Seller Management — Accounts &amp; Moderation</Text>
      </TouchableOpacity>

      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Live inventory</Text>
        <Text style={styles.cardSubtitle}>
          Changes here update the same inventory used by the public app and website.
        </Text>

        {cars.length === 0 ? (
          <Text style={styles.muted}>No vehicles returned from the live inventory.</Text>
        ) : (
          cars.map((car) => {
            const busy = busyId === car._id;
            return (
              <View key={car._id} style={styles.inventoryRow}>
                <Link href={`/admin/edit-vehicle/${car._id}`} asChild>
                  <TouchableOpacity style={styles.inventoryInfo}>
                    <Text style={styles.inventoryTitle}>{vehicleTitle(car)}</Text>
                    <Text style={styles.inventoryMeta}>
                      {formatMileage(car.mileage)} · {formatPrice(car.price)}
                    </Text>
                    <Text style={styles.editLink}>Edit vehicle →</Text>
                  </TouchableOpacity>
                </Link>

                <View style={styles.rowActions}>
                  <View style={styles.statusRowCompact}>
                    {(["available", "pending", "sold"] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.compactStatus,
                          car.status === status && styles.compactStatusSelected,
                        ]}
                        disabled={busy}
                        onPress={() => handleStatusChange(car, status)}
                      >
                        <Text
                          style={[
                            styles.compactStatusText,
                            car.status === status && styles.compactStatusTextSelected,
                          ]}
                        >
                          {status === "available" ? "A" : status === "pending" ? "P" : "S"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    disabled={busy}
                    onPress={() => confirmDelete(car)}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color="#b91c1c" />
                    ) : (
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={confirmLogoutAll} accessibilityRole="button">
        <Text style={styles.logoutAllText}>Log Out Everywhere</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  welcome: { fontSize: 22, fontWeight: "900", color: "#111827", marginTop: 12 },
  role: { marginTop: 4, color: "#6b7280", fontSize: 13, textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 20, flexWrap: "wrap" },
  stat: { flexBasis: "23%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { color: "#6b7280", fontSize: 11, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  primaryButton: { flex: 1, backgroundColor: "#dc2626", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  secondaryButton: { flex: 1, backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  secondaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  marketplaceButton: { marginTop: 10, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, paddingVertical: 13, alignItems: "center", backgroundColor: "#fff" },
  marketplaceButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  success: { color: "#15803d", fontSize: 13, marginTop: 14, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 14, fontWeight: "600" },
  card: { marginTop: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  cardSubtitle: { color: "#6b7280", fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 6 },
  muted: { color: "#6b7280", fontSize: 13, marginTop: 12 },
  inventoryRow: { borderTopWidth: 1, borderTopColor: "#eef0f2", paddingVertical: 12, gap: 10 },
  inventoryInfo: { flex: 1 },
  inventoryTitle: { color: "#111827", fontWeight: "800", fontSize: 14 },
  inventoryMeta: { color: "#6b7280", fontSize: 12, marginTop: 3 },
  editLink: { color: "#1d4ed8", fontSize: 12, fontWeight: "800", marginTop: 6 },
  rowActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusRowCompact: { flexDirection: "row", gap: 5 },
  compactStatus: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  compactStatusSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  compactStatusText: { color: "#6b7280", fontSize: 11, fontWeight: "900" },
  compactStatusTextSelected: { color: "#fff" },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#fecaca" },
  deleteButtonText: { color: "#b91c1c", fontWeight: "800", fontSize: 12 },
  logoutButton: { marginTop: 20, backgroundColor: "#111827", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  logoutAllText: { color: "#b91c1c", fontWeight: "700", fontSize: 12, textAlign: "center", marginTop: 12 },
});
