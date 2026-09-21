import { useState } from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DEALER_PHONE, DEALER_PHONE_DISPLAY } from "@/lib/constants";
import { askContactCenterAI, buildWhatsAppUrl, ContactAiContext } from "@/lib/contactCenterApi";
import { verifySellerSession } from "@/lib/marketplaceAuth";
import { createOrReuseConversation } from "@/lib/messagesApi";

type AiMessage = { role: "user" | "assistant"; text: string };

/**
 * The floating Contact Center entry point — reused on Home and every
 * vehicle/listing/auction detail screen. `context` (when provided) lets
 * "AI Assistant" ground its answer in that specific vehicle/listing/auction
 * and lets "Send Message" start the right conversation directly, matching
 * the existing "Message Dealer"/"Message Seller" flow.
 */
export default function ContactCenterButton({ context }: { context?: ContactAiContext }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "ai">("menu");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiDraft, setAiDraft] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [messageBusy, setMessageBusy] = useState(false);

  function closeAndReset() {
    setOpen(false);
    setView("menu");
  }

  function handleCall() {
    Linking.openURL(`tel:${DEALER_PHONE}`);
    closeAndReset();
  }

  function handleWhatsApp() {
    Linking.openURL(buildWhatsAppUrl("Hi, I have a question for Drive Prime Motors."));
    closeAndReset();
  }

  async function handleSendMessage() {
    setMessageBusy(true);
    try {
      const seller = await verifySellerSession();
      if (!seller) {
        closeAndReset();
        router.push("/sell/login");
        return;
      }
      if (context && (context.vehicleId || context.marketplaceListingId || context.auctionId)) {
        const conversation = await createOrReuseConversation(context);
        closeAndReset();
        router.push(`/sell/conversation/${conversation._id}`);
      } else {
        closeAndReset();
        router.push("/sell/messages");
      }
    } catch {
      closeAndReset();
      router.push("/sell/messages");
    } finally {
      setMessageBusy(false);
    }
  }

  async function handleAskAi() {
    const text = aiDraft.trim();
    if (!text) return;
    setAiMessages((current) => [...current, { role: "user", text }]);
    setAiDraft("");
    setAiSending(true);
    setAiError(null);
    try {
      const reply = await askContactCenterAI(text, context);
      setAiMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "The AI Assistant couldn't respond right now.");
    } finally {
      setAiSending(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 78 }]}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open Contact Center"
      >
        <Text style={styles.fabIcon}>💬</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={closeAndReset}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            style={styles.sheetWrap}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
              {view === "menu" ? (
                <>
                  <Text style={styles.heading}>Contact Center</Text>
                  <Text style={styles.subheading}>How would you like to reach us?</Text>

                  <TouchableOpacity style={styles.option} onPress={() => setView("ai")} accessibilityRole="button">
                    <Text style={styles.optionIcon}>🤖</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>AI Assistant</Text>
                      <Text style={styles.optionSubtitle}>Ask about inventory, hours, financing, and more</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.option} onPress={handleWhatsApp} accessibilityRole="button">
                    <Text style={styles.optionIcon}>💬</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>WhatsApp Us</Text>
                      <Text style={styles.optionSubtitle}>{DEALER_PHONE_DISPLAY}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.option} onPress={handleCall} accessibilityRole="button">
                    <Text style={styles.optionIcon}>📞</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>Call Drive Prime Motors</Text>
                      <Text style={styles.optionSubtitle}>{DEALER_PHONE_DISPLAY}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.option} onPress={handleSendMessage} disabled={messageBusy} accessibilityRole="button">
                    <Text style={styles.optionIcon}>✉️</Text>
                    <View style={styles.optionTextWrap}>
                      <Text style={styles.optionTitle}>Send Message</Text>
                      <Text style={styles.optionSubtitle}>Message our team in-app — sign-in required</Text>
                    </View>
                    {messageBusy ? <ActivityIndicator color="#dc2626" /> : null}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelButton} onPress={closeAndReset}>
                    <Text style={styles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.aiHeaderRow}>
                    <TouchableOpacity onPress={() => setView("menu")} accessibilityRole="button">
                      <Text style={styles.backLink}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.heading}>AI Assistant</Text>
                    <View style={{ width: 44 }} />
                  </View>

                  <ScrollView style={styles.aiMessages} contentContainerStyle={styles.aiMessagesContent}>
                    {aiMessages.length === 0 ? (
                      <Text style={styles.aiEmptyText}>
                        Ask about current inventory, hours, financing, or how Sell My Car works.
                      </Text>
                    ) : (
                      aiMessages.map((m, i) => (
                        <View key={i} style={[styles.aiBubbleRow, m.role === "user" && styles.aiBubbleRowMine]}>
                          <View style={[styles.aiBubble, m.role === "user" ? styles.aiBubbleMine : styles.aiBubbleTheirs]}>
                            <Text style={[styles.aiBubbleText, m.role === "user" && styles.aiBubbleTextMine]}>{m.text}</Text>
                          </View>
                        </View>
                      ))
                    )}
                    {aiSending ? <ActivityIndicator color="#dc2626" style={{ marginTop: 10 }} /> : null}
                  </ScrollView>

                  {aiError ? <Text style={styles.aiError}>{aiError}</Text> : null}

                  <View style={styles.aiInputRow}>
                    <TextInput
                      style={styles.aiInput}
                      value={aiDraft}
                      onChangeText={setAiDraft}
                      placeholder="Ask a question…"
                      placeholderTextColor="#9ca3af"
                      maxLength={1000}
                    />
                    <TouchableOpacity
                      style={[styles.aiSendButton, (!aiDraft.trim() || aiSending) && styles.aiSendButtonDisabled]}
                      onPress={handleAskAi}
                      disabled={!aiDraft.trim() || aiSending}
                    >
                      <Text style={styles.aiSendButtonText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 50,
  },
  fabIcon: { fontSize: 26 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheetWrap: { width: "100%" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" },

  heading: { fontSize: 20, fontWeight: "900", color: "#111827", textAlign: "center" },
  subheading: { color: "#6b7280", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 16 },

  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionIcon: { fontSize: 24, marginRight: 12 },
  optionTextWrap: { flex: 1 },
  optionTitle: { color: "#111827", fontWeight: "800", fontSize: 15 },
  optionSubtitle: { color: "#6b7280", fontSize: 12, marginTop: 2 },

  cancelButton: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  cancelButtonText: { color: "#6b7280", fontWeight: "700", fontSize: 14 },

  aiHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  backLink: { color: "#dc2626", fontWeight: "800", fontSize: 14, width: 60 },

  aiMessages: { maxHeight: 320 },
  aiMessagesContent: { paddingVertical: 8 },
  aiEmptyText: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 20, lineHeight: 19 },
  aiBubbleRow: { marginBottom: 10, alignItems: "flex-start" },
  aiBubbleRowMine: { alignItems: "flex-end" },
  aiBubble: { maxWidth: "85%", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  aiBubbleTheirs: { backgroundColor: "#f3f4f6" },
  aiBubbleMine: { backgroundColor: "#dc2626" },
  aiBubbleText: { color: "#111827", fontSize: 13, lineHeight: 19 },
  aiBubbleTextMine: { color: "#fff" },

  aiError: { color: "#b91c1c", fontSize: 12, fontWeight: "700", marginBottom: 8 },

  aiInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  aiInput: { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#111827" },
  aiSendButton: { backgroundColor: "#dc2626", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  aiSendButtonDisabled: { opacity: 0.5 },
  aiSendButtonText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
