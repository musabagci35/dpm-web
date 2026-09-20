import { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AdminSellerDetail,
  addSellerNote,
  deleteSellerAccount,
  disableSellerListings,
  enableSellerListings,
  fetchAdminSellerDetail,
  freezeSeller,
  revokeSellerSessions,
  sendSellerResetEmail,
  suspendSeller,
  unfreezeSeller,
  unsuspendSeller,
} from "@/lib/adminSellers";

type ReasonPrompt = "freeze" | "suspend" | "delete" | null;

export default function AdminSellerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminSellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [reasonPrompt, setReasonPrompt] = useState<ReasonPrompt>(null);
  const [reasonText, setReasonText] = useState("");
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setDetail(await fetchAdminSellerDetail(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this seller.");
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function runAction(label: string, action: () => Promise<unknown>) {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await action();
      setMessage(`${label} done.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${label.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  }

  function openReasonPrompt(kind: ReasonPrompt) {
    setReasonText("");
    setReasonPrompt(kind);
  }

  async function submitReasonPrompt() {
    if (!id || !reasonPrompt) return;
    if (!reasonText.trim()) {
      Alert.alert("Reason required", "Enter a reason before continuing.");
      return;
    }
    const reason = reasonText.trim();
    setReasonPrompt(null);

    if (reasonPrompt === "freeze") {
      await runAction("Freeze account", () => freezeSeller(id, reason));
    } else if (reasonPrompt === "suspend") {
      await runAction("Suspend account", () => suspendSeller(id, reason));
    } else if (reasonPrompt === "delete") {
      await runAction("Delete account", () => deleteSellerAccount(id, reason));
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete this seller account?",
      "This soft-deletes the account, scrubs personal info, and permanently hides all of their listings and auctions. Audit and payment records are kept. This cannot be undone from this screen.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Continue", style: "destructive", onPress: () => openReasonPrompt("delete") },
      ]
    );
  }

  async function submitNote() {
    if (!id || !noteText.trim()) return;
    const note = noteText.trim();
    setNoteText("");
    await runAction("Add note", () => addSellerNote(id, note));
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this seller</Text>
        {error ? <Text style={styles.centeredText}>{error}</Text> : null}
        <TouchableOpacity style={styles.primaryButton} onPress={load}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { seller, listings, auctions } = detail;
  const isActive = seller.status === "active";
  const isFrozen = seller.status === "frozen";
  const isSuspended = seller.status === "suspended";
  const isDeleted = seller.status === "deleted";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{seller.name || "(no name)"}</Text>
        <Text style={styles.email}>{seller.email}</Text>
        {seller.phone ? <Text style={styles.email}>{seller.phone}</Text> : null}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? "#15803d" : isDeleted ? "#6b7280" : "#b91c1c" }]}>
            <Text style={styles.statusBadgeText}>{seller.status.toUpperCase()}</Text>
          </View>
          <Text style={[styles.verifyPill, seller.emailVerified && styles.verifyPillOn]}>
            {seller.emailVerified ? "✓ Email verified" : "Email unverified"}
          </Text>
          <Text style={[styles.verifyPill, seller.phoneVerified && styles.verifyPillOn]}>
            {seller.phoneVerified ? "✓ Phone verified" : "Phone unverified"}
          </Text>
        </View>
        {seller.statusReason ? (
          <Text style={styles.statusReason}>Reason: {seller.statusReason}</Text>
        ) : null}
      </View>

      {message ? <Text style={styles.success}>{message}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {reasonPrompt ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {reasonPrompt === "freeze" ? "Freeze reason" : reasonPrompt === "suspend" ? "Suspend reason" : "Deletion reason"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Explain why (kept in the audit log)"
            value={reasonText}
            onChangeText={setReasonText}
            multiline
          />
          <View style={styles.inlineRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setReasonPrompt(null)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={submitReasonPrompt}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!isDeleted && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account controls</Text>
          <View style={styles.actionsGrid}>
            {isActive && (
              <>
                <ActionButton label="Freeze Account" danger onPress={() => openReasonPrompt("freeze")} disabled={busy} />
                <ActionButton label="Suspend Account" danger onPress={() => openReasonPrompt("suspend")} disabled={busy} />
                <ActionButton label="Disable All Listings" onPress={() => runAction("Disable listings", () => disableSellerListings(id!))} disabled={busy} />
                <ActionButton label="Enable All Listings" onPress={() => runAction("Enable listings", () => enableSellerListings(id!))} disabled={busy} />
              </>
            )}
            {isFrozen && (
              <ActionButton label="Unfreeze Account" onPress={() => runAction("Unfreeze account", () => unfreezeSeller(id!))} disabled={busy} />
            )}
            {isSuspended && (
              <ActionButton label="Unsuspend Account" onPress={() => runAction("Unsuspend account", () => unsuspendSeller(id!))} disabled={busy} />
            )}
            <ActionButton label="Revoke All Sessions" onPress={() => runAction("Revoke sessions", () => revokeSellerSessions(id!))} disabled={busy} />
            <ActionButton label="Send Password Reset Email" onPress={() => runAction("Send reset email", () => sendSellerResetEmail(id!))} disabled={busy} />
          </View>

          <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete} disabled={busy}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Moderation notes ({seller.moderationNotes.length})</Text>
        {seller.moderationNotes.map((n, i) => (
          <View key={i} style={styles.noteRow}>
            <Text style={styles.noteText}>{n.note}</Text>
            <Text style={styles.noteMeta}>
              {n.addedByEmail} · {new Date(n.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholder="Add an internal note"
          value={noteText}
          onChangeText={setNoteText}
          multiline
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={submitNote} disabled={busy || !noteText.trim()}>
          <Text style={styles.secondaryButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Listings ({listings.length})</Text>
        {listings.length === 0 ? <Text style={styles.emptyText}>None</Text> : null}
        {listings.map((l) => (
          <TouchableOpacity
            key={l._id}
            style={styles.itemRow}
            onPress={() => router.push(`/admin/marketplace-listing/${l._id}`)}
          >
            <Text style={styles.itemTitle}>
              {l.year} {l.make} {l.model} {l.trim || ""}
            </Text>
            <View style={styles.inlineRow}>
              <Text style={styles.itemMeta}>{l.status}</Text>
              {l.adminHidden ? <Text style={styles.itemHidden}>hidden</Text> : null}
              {l.flagged ? <Text style={styles.itemFlag}>⚑ flagged ({l.reports.length})</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Auctions ({auctions.length})</Text>
        {auctions.length === 0 ? <Text style={styles.emptyText}>None</Text> : null}
        {auctions.map((a) => (
          <TouchableOpacity
            key={a._id}
            style={styles.itemRow}
            onPress={() => router.push(`/admin/auction-listing/${a._id}`)}
          >
            <Text style={styles.itemTitle}>
              {a.year} {a.make} {a.model} {a.trim || ""}
            </Text>
            <View style={styles.inlineRow}>
              <Text style={styles.itemMeta}>{a.status}</Text>
              {a.adminHidden ? <Text style={styles.itemHidden}>hidden</Text> : null}
              {a.flagged ? <Text style={styles.itemFlag}>⚑ flagged ({a.reports.length})</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, danger && styles.actionButtonDanger, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionButtonText, danger && styles.actionButtonTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#111827", marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "900", color: "#111827" },
  email: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  statusReason: { color: "#b91c1c", fontSize: 12, marginTop: 10, fontWeight: "600" },
  verifyPill: { fontSize: 11, fontWeight: "800", color: "#9ca3af" },
  verifyPillOn: { color: "#15803d" },
  success: { color: "#15803d", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 10, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: "#111827", backgroundColor: "#fff", minHeight: 44 },
  inlineRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: { backgroundColor: "#111827", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, flexGrow: 1 },
  actionButtonDanger: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#dc2626" },
  actionButtonText: { color: "#fff", fontWeight: "800", fontSize: 12, textAlign: "center" },
  actionButtonTextDanger: { color: "#dc2626" },
  deleteButton: { marginTop: 14, borderWidth: 1.5, borderColor: "#dc2626", borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  deleteButtonText: { color: "#dc2626", fontWeight: "900", fontSize: 13 },
  primaryButton: { backgroundColor: "#dc2626", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignItems: "center" },
  secondaryButton: { borderWidth: 1, borderColor: "#111827", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignItems: "center", marginTop: 8 },
  secondaryButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  noteRow: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingBottom: 8, marginBottom: 8 },
  noteText: { color: "#111827", fontSize: 13 },
  noteMeta: { color: "#9ca3af", fontSize: 11, marginTop: 3 },
  emptyText: { color: "#9ca3af", fontSize: 12, fontStyle: "italic" },
  itemRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  itemTitle: { color: "#111827", fontWeight: "700", fontSize: 13 },
  itemMeta: { color: "#6b7280", fontSize: 11, fontWeight: "700" },
  itemHidden: { color: "#b45309", fontSize: 11, fontWeight: "800" },
  itemFlag: { color: "#b91c1c", fontSize: 11, fontWeight: "800" },
});
