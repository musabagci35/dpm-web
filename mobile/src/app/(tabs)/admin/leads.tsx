import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AdminLead,
  fetchAdminLeads,
  LeadStatus,
  setLeadArchived,
  updateLeadStatus,
} from "@/lib/api";
import { formatAppointmentAt } from "@/lib/format";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "appointment",
  "won",
  "lost",
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "#1d4ed8",
  contacted: "#b45309",
  qualified: "#7c3aed",
  appointment: "#0891b2",
  won: "#15803d",
  lost: "#6b7280",
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type LeadsView = "active" | "archived";

export default function AdminLeadsScreen() {
  const [view, setView] = useState<LeadsView>("active");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetView: LeadsView) => {
    try {
      setError(null);
      setLeads(await fetchAdminLeads({ archived: targetView === "archived" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load leads."
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(view).finally(() => setLoading(false));
  }, [load, view]);

  async function onRefresh() {
    setRefreshing(true);
    await load(view);
    setRefreshing(false);
  }

  async function handleStatusChange(lead: AdminLead, status: LeadStatus) {
    if (lead.status === status) return;
    setBusyId(lead._id);
    setError(null);

    try {
      const updated = await updateLeadStatus(lead._id, status);
      setLeads((current) =>
        current.map((item) => (item._id === updated._id ? updated : item))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update lead status."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleRestore(lead: AdminLead) {
    setBusyId(lead._id);
    setError(null);
    try {
      await setLeadArchived(lead._id, false);
      // Restored leads belong back in the active list, not this one.
      setLeads((current) => current.filter((item) => item._id !== lead._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore this lead.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.heading}>Leads &amp; contact requests</Text>

      <View style={styles.viewTabs}>
        <TouchableOpacity
          style={[styles.viewTab, view === "active" && styles.viewTabSelected]}
          onPress={() => setView("active")}
        >
          <Text style={[styles.viewTabText, view === "active" && styles.viewTabTextSelected]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewTab, view === "archived" && styles.viewTabSelected]}
          onPress={() => setView("archived")}
        >
          <Text style={[styles.viewTabText, view === "archived" && styles.viewTabTextSelected]}>Archived</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>
        {leads.length} {leads.length === 1 ? "lead" : "leads"}
        {view === "archived" ? " archived" : ""}
      </Text>

      {view === "archived" ? (
        <Text style={styles.archivedHint}>
          Appointment leads are archived automatically 72 hours after their appointment. Nothing
          is ever deleted — restore a lead to move it back to the active list.
        </Text>
      ) : null}

      {error && <Text style={styles.error}>{error}</Text>}

      {leads.length === 0 ? (
        <Text style={styles.muted}>
          {view === "archived" ? "No archived leads." : "No leads yet."}
        </Text>
      ) : (
        leads.map((lead) => (
          <View key={lead._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{lead.name}</Text>
              <Text style={styles.date}>{formatDate(lead.createdAt)}</Text>
            </View>

            <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
              <Text style={styles.link}>{lead.phone}</Text>
            </TouchableOpacity>

            {lead.email ? (
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${lead.email}`)}>
                <Text style={styles.link}>{lead.email}</Text>
              </TouchableOpacity>
            ) : null}

            {lead.carTitle ? (
              <Text style={styles.meta}>Vehicle: {lead.carTitle}</Text>
            ) : null}
            {lead.vin ? <Text style={styles.meta}>VIN: {lead.vin}</Text> : null}
            {lead.appointmentAt ? (
              <Text style={styles.appointment}>
                Appointment: {formatAppointmentAt(lead.appointmentAt)}
              </Text>
            ) : null}
            {lead.message ? (
              <Text style={styles.message}>{lead.message}</Text>
            ) : null}

            {view === "archived" ? (
              <>
                {lead.archivedAt ? (
                  <Text style={styles.meta}>Archived {formatDate(lead.archivedAt)}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.restoreButton}
                  disabled={busyId === lead._id}
                  onPress={() => handleRestore(lead)}
                >
                  {busyId === lead._id ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.restoreButtonText}>Restore to Active</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Status</Text>
                <View style={styles.statusRow}>
                  {STATUSES.map((status) => {
                    const active = lead.status === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusPill,
                          active && {
                            backgroundColor: STATUS_COLORS[status],
                            borderColor: STATUS_COLORS[status],
                          },
                        ]}
                        disabled={busyId === lead._id}
                        onPress={() => handleStatusChange(lead, status)}
                      >
                        <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  heading: { fontSize: 22, fontWeight: "900", color: "#111827" },
  viewTabs: { flexDirection: "row", gap: 8, marginTop: 14 },
  viewTab: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  viewTabSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  viewTabText: { color: "#374151", fontSize: 13, fontWeight: "800" },
  viewTabTextSelected: { color: "#fff" },
  subheading: { color: "#6b7280", fontSize: 13, marginTop: 12, marginBottom: 4 },
  archivedHint: { color: "#9ca3af", fontSize: 12, lineHeight: 17, marginBottom: 12 },
  error: { color: "#b91c1c", fontSize: 13, marginBottom: 12, fontWeight: "600" },
  muted: { color: "#6b7280", fontSize: 13, marginTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "900", color: "#111827" },
  date: { fontSize: 12, color: "#9ca3af", fontWeight: "700" },
  link: { color: "#1d4ed8", fontSize: 13, fontWeight: "700", marginTop: 6 },
  meta: { color: "#374151", fontSize: 13, marginTop: 6 },
  appointment: { color: "#0891b2", fontSize: 13, fontWeight: "800", marginTop: 6 },
  message: { color: "#374151", fontSize: 13, lineHeight: 19, marginTop: 10 },
  sectionLabel: { color: "#374151", fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 8 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: { color: "#374151", fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  statusPillTextActive: { color: "#fff" },
  restoreButton: { marginTop: 14, borderWidth: 1, borderColor: "#111827", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  restoreButtonText: { color: "#111827", fontWeight: "800", fontSize: 13 },
});
