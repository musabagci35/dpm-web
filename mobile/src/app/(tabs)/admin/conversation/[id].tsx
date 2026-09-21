import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  adminConversationAction,
  Conversation,
  fetchAdminConversations,
  fetchMessages,
  markConversationRead,
  Message,
  sendMessage,
} from "@/lib/messagesApi";

const POLL_INTERVAL_MS = 10000;

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function AdminConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        // The admin list route is what carries the enriched customer/context
        // display fields this screen's header needs; there's no dedicated
        // admin single-conversation GET in Phase 1.
        const [all, msgs] = await Promise.all([fetchAdminConversations(), fetchMessages(id)]);
        const found = all.find((c) => c._id === id) || null;
        setConversation(found);
        setMessages(msgs);
        markConversationRead(id).catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load this conversation.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    pollRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || !id) return;
    setSending(true);
    setSendError(null);
    try {
      const message = await sendMessage(id, text);
      setMessages((current) => [...current, message]);
      setDraft("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  async function handleAction(action: "close" | "reopen" | "takeover") {
    if (!id) return;
    setActionBusy(true);
    try {
      const updated = await adminConversationAction(id, action);
      setConversation((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update this conversation.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (error || !conversation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredHeading}>Couldn&apos;t load this conversation</Text>
        <Text style={styles.centeredText}>{error || "It may no longer be available."}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerName} numberOfLines={1}>{conversation.customerName || "Customer"}</Text>
        <Text style={styles.headerContext} numberOfLines={1}>{conversation.context?.label || ""}</Text>

        <View style={styles.actionRow}>
          {conversation.status !== "closed" ? (
            <TouchableOpacity style={styles.actionButton} disabled={actionBusy} onPress={() => handleAction("close")}>
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} disabled={actionBusy} onPress={() => handleAction("reopen")}>
              <Text style={styles.actionButtonText}>Reopen</Text>
            </TouchableOpacity>
          )}
          {!conversation.humanTakeover ? (
            <TouchableOpacity style={styles.actionButton} disabled={actionBusy} onPress={() => handleAction("takeover")}>
              <Text style={styles.actionButtonText}>Take Over</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet.</Text>
        ) : (
          messages.map((m) => {
            const mine = m.senderType === "admin";
            return (
              <View key={m._id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                </View>
                <Text style={[styles.bubbleMeta, mine && styles.bubbleMetaMine]}>
                  {m.senderType === "customer" ? "Customer" : m.senderType === "seller" ? "Seller" : "You"} · {formatTime(m.createdAt)}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Reply…"
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || !draft.trim()}
        >
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendButtonText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", paddingHorizontal: 28 },
  centeredHeading: { color: "#111827", fontSize: 17, fontWeight: "900", textAlign: "center" },
  centeredText: { color: "#6b7280", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },

  header: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", padding: 14 },
  headerName: { color: "#111827", fontWeight: "900", fontSize: 16 },
  headerContext: { color: "#6b7280", fontSize: 12, marginTop: 2, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionButton: { borderWidth: 1, borderColor: "#111827", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  actionButtonText: { color: "#111827", fontWeight: "800", fontSize: 12 },

  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  emptyText: { color: "#9ca3af", textAlign: "center", marginTop: 30 },

  bubbleRow: { marginBottom: 14, alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: "#111827", borderBottomRightRadius: 4 },
  bubbleText: { color: "#111827", fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleMeta: { color: "#9ca3af", fontSize: 10, marginTop: 4, fontWeight: "700" },
  bubbleMetaMine: { textAlign: "right" },

  sendError: { color: "#b91c1c", fontSize: 12, fontWeight: "700", paddingHorizontal: 16, paddingBottom: 4 },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 110,
    color: "#111827",
  },
  sendButton: { backgroundColor: "#111827", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
