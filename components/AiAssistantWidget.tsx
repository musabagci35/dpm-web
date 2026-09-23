"use client";

import { useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { askContactCenterAI } from "@/lib/contactAiApi";

type Message = { role: "user" | "assistant"; text: string };

/**
 * Floating "AI Assistant" entry point for the public website — reuses the
 * existing server-side /api/contact-ai route (same one the mobile app's
 * Contact Center already calls) rather than adding any new AI logic or
 * exposing a key client-side. Answers are grounded strictly in dealership
 * facts and current inventory on the server; nothing is invented here.
 */
export default function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    setMessages((current) => [...current, { role: "user", text }]);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const reply = await askContactCenterAI(text);
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The AI Assistant couldn't respond right now."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI Assistant"
        className={`fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-600 bg-gray-900 text-white shadow-xl transition hover:bg-black lg:bottom-6 ${
          open ? "hidden" : "flex"
        }`}
      >
        <Bot className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-end sm:justify-end sm:bg-transparent"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[80vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:m-6 sm:max-h-[560px] sm:w-96 sm:rounded-2xl"
          >
            <div className="flex items-center justify-between rounded-t-3xl bg-gray-900 px-5 py-4 text-white sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-red-500" aria-hidden="true" />
                <span className="font-black">AI Assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI Assistant"
                className="rounded-full p-1 hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Ask about current inventory, hours, financing, or how Sell My
                  Car works. For anything else, call{" "}
                  <a href="tel:+19162618880" className="font-semibold text-red-600">
                    (916) 261-8880
                  </a>
                  .
                </p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="px-4 pb-2 text-sm font-semibold text-red-600">{error}</p>
            )}

            <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question…"
                maxLength={1000}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
