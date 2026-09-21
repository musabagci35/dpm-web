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

import { Conversation, fetchMyConversations } from "@/lib/messagesApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";

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

export default function MessagesInboxScreen() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setConversations(await fetchMyConversations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your messages.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setChecking(true);
      verifySellerSession().then((seller) => {
        if (cancelled) return;
        setSignedIn(Boolean(seller));
        setChecking(false);
        if (seller) {
          setLoading(true);
          load().finally(() => setLoading(false));
        }
      });
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Sign in to see your messages</Text>
        <Text style={styles.centeredText}>
          Messages are available once you sign in to your Drive Prime Motors account.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/sell/login")}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} size="large" color="#dc2626" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : conversations.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateHeading}>No conversations yet</Text>
          <Text style={styles.stateText}>
            Messages you send about a vehicle, listing, or auction will show up here.
          </Text>
        </View>
      ) : (
        conversations.map((c) => {
          const unread = c.viewerRole === "seller" ? c.unreadForSeller : false;
          return (
            <TouchableOpacity
              key={c._id}
              style={[styles.card, unread && styles.cardUnread]}
              onPress={() => router.push(`/sell/conversation/${c._id}`)}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {c.counterpartyName || "Conversation"}
                </Text>
                <Text style={styles.cardTime}>{formatTime(c.lastMessage?.createdAt || c.lastMessageAt)}</Text>
              </View>
              <Text style={styles.cardContext} numberOfLines={1}>
                {c.context?.label || "Vehicle"}
                {c.viewerRole === "seller" ? " · Your listing" : ""}
              </Text>
              {c.lastMessage ? (
                <Text style={[styles.cardPreview, unread && styles.cardPreviewUnread]} numberOfLines={2}>
                  {c.lastMessage.text}
                </Text>
              ) : null}
              <View style={styles.cardFooter}>
                {c.status === "closed" ? (
                  <View style={styles.closedPill}>
                    <Text style={styles.closedPillText}>Closed</Text>
                  </View>
                ) : null}
                {unread ? <View style={styles.unreadDot} /> : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  primaryButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingHorizontal: 22, paddingVertical: 13, marginTop: 18 },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  heading: { fontSize: 22, fontWeight: "900", color: "#111827", marginBottom: 14 },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 12, fontWeight: "600" },

  stateBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", padding: 22, alignItems: "center" },
  stateHeading: { color: "#111827", fontSize: 15, fontWeight: "900", textAlign: "center" },
  stateText: { color: "#6b7280", fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },

  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 14, marginBottom: 10 },
  cardUnread: { borderColor: "#dc2626", backgroundColor: "#fff7f7" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { flex: 1, color: "#111827", fontWeight: "900", fontSize: 15, marginRight: 8 },
  cardTime: { color: "#9ca3af", fontSize: 11, fontWeight: "700" },
  cardContext: { color: "#6b7280", fontSize: 12, marginTop: 3, fontWeight: "700" },
  cardPreview: { color: "#374151", fontSize: 13, marginTop: 6, lineHeight: 18 },
  cardPreviewUnread: { fontWeight: "700", color: "#111827" },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 8 },
  closedPill: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  closedPillText: { color: "#6b7280", fontSize: 10, fontWeight: "800" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#dc2626", marginLeft: "auto" },
});
