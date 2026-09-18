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

import { AdminLead, fetchAdminLeads, LeadStatus, updateLeadStatus } from "@/lib/api";

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

export default function AdminLeadsScreen() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLeads(await fetchAdminLeads());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load leads."
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
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
      <Text style={styles.subheading}>
        {leads.length} {leads.length === 1 ? "lead" : "leads"} total
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {leads.length === 0 ? (
        <Text style={styles.muted}>No leads yet.</Text>
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
            {lead.message ? (
              <Text style={styles.message}>{lead.message}</Text>
            ) : null}

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
  subheading: { color: "#6b7280", fontSize: 13, marginTop: 4, marginBottom: 12 },
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
});
