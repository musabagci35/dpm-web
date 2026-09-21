import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Conversation, fetchAdminConversations } from "@/lib/messagesApi";

const CONTEXT_LABEL: Record<string, string> = {
  vehicle: "Dealer Inventory",
  marketplaceListing: "Marketplace Listing",
  auction: "Auction",
};

function formatTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Filter = "all" | "vehicle" | "marketplaceListing" | "auction";

export default function AdminMessagesScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setConversations(await fetchAdminConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const visible = conversations.filter((c) => filter === "all" || c.context?.type === filter);

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>Messages</Text>

      <View style={styles.filterRow}>
        {(["all", "vehicle", "marketplaceListing", "auction"] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillSelected]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterPillText, filter === f && styles.filterPillTextSelected]}>
              {f === "all" ? "All" : CONTEXT_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {visible.length === 0 ? (
        <Text style={styles.muted}>No conversations yet.</Text>
      ) : (
        visible.map((c) => (
          <TouchableOpacity
            key={c._id}
            style={[styles.card, c.unreadForAdmin && styles.cardUnread]}
            onPress={() => router.push(`/admin/conversation/${c._id}`)}
            accessibilityRole="button"
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName} numberOfLines={1}>{c.customerName || "Customer"}</Text>
              <Text style={styles.cardTime}>{formatTime(c.lastMessage?.createdAt || c.lastMessageAt)}</Text>
            </View>
            <Text style={styles.cardContext} numberOfLines={1}>
              {CONTEXT_LABEL[c.context?.type || "vehicle"]} · {c.context?.label || ""}
            </Text>
            {c.lastMessage ? (
              <Text style={[styles.cardPreview, c.unreadForAdmin && styles.cardPreviewUnread]} numberOfLines={2}>
                {c.lastMessage.senderType === "admin" ? "You: " : ""}{c.lastMessage.text}
              </Text>
            ) : null}
            <View style={styles.cardFooter}>
              <View style={[styles.statusPill, c.status === "closed" && styles.statusPillClosed, c.status === "escalated" && styles.statusPillEscalated]}>
                <Text style={styles.statusPillText}>{c.status}</Text>
              </View>
              {c.unreadForAdmin ? <View style={styles.unreadDot} /> : null}
            </View>
          </TouchableOpacity>
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

  filterRow: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  filterPill: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillSelected: { backgroundColor: "#111827", borderColor: "#111827" },
  filterPillText: { color: "#374151", fontSize: 12, fontWeight: "800" },
  filterPillTextSelected: { color: "#fff" },

  error: { color: "#b91c1c", fontSize: 13, marginTop: 14, fontWeight: "600" },
  muted: { color: "#6b7280", fontSize: 13, marginTop: 20 },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 14, marginTop: 14 },
  cardUnread: { borderColor: "#dc2626", backgroundColor: "#fff7f7" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { flex: 1, color: "#111827", fontWeight: "900", fontSize: 15, marginRight: 8 },
  cardTime: { color: "#9ca3af", fontSize: 11, fontWeight: "700" },
  cardContext: { color: "#6b7280", fontSize: 12, marginTop: 3, fontWeight: "700" },
  cardPreview: { color: "#374151", fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardPreviewUnread: { fontWeight: "700", color: "#111827" },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  statusPill: { backgroundColor: "#dbeafe", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  statusPillClosed: { backgroundColor: "#f3f4f6" },
  statusPillEscalated: { backgroundColor: "#fee2e2" },
  statusPillText: { color: "#1e3a8a", fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", marginLeft: "auto" },
});
