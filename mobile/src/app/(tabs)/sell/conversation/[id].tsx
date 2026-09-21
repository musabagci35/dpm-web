import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
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

import {
  Conversation,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  Message,
  sendMessage,
  SenderType,
} from "@/lib/messagesApi";

const POLL_INTERVAL_MS = 10000;

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ConversationThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [viewerRole, setViewerRole] = useState<SenderType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const [{ conversation: convo, viewerRole: role }, msgs] = await Promise.all([
          fetchConversation(id),
          fetchMessages(id),
        ]);
        setConversation(convo);
        setViewerRole(role);
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

  const closed = conversation.status === "closed";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>{conversation.context?.label || "Conversation"}</Text>
        {closed ? <Text style={styles.headerClosed}>Closed — sending a message reopens it</Text> : null}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <Text style={styles.emptyText}>No messages yet — say hello.</Text>
        ) : (
          messages.map((m) => {
            const mine = m.senderType === viewerRole;
            return (
              <View key={m._id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{m.text}</Text>
                </View>
                <Text style={[styles.bubbleMeta, mine && styles.bubbleMetaMine]}>
                  {formatTime(m.createdAt)}
                  {mine ? (m.readAt ? " · Read" : " · Sent") : ""}
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
          placeholder="Type a message…"
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
  headerTitle: { color: "#111827", fontWeight: "900", fontSize: 15 },
  headerClosed: { color: "#b45309", fontSize: 11, fontWeight: "700", marginTop: 3 },

  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  emptyText: { color: "#9ca3af", textAlign: "center", marginTop: 30 },

  bubbleRow: { marginBottom: 14, alignItems: "flex-start" },
  bubbleRowMine: { alignItems: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: "#dc2626", borderBottomRightRadius: 4 },
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
  sendButton: { backgroundColor: "#dc2626", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
