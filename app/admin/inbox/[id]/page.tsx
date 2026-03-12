"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdminChatPage() {
  const params = useParams();
  const id = params.id as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const msgs = await fetch(`/api/conversations/${id}/messages`).then((r) => r.json());
    setMessages(msgs);
  };

  useEffect(() => {
    load();
  }, [id]);

  const send = async () => {
    if (!text) return;
    await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "dealer", text }),
    });
    setText("");
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Conversation</h1>

      <div className="max-h-[60vh] space-y-2 overflow-auto rounded-2xl border bg-gray-50 p-4">
        {messages.map((m) => (
          <div key={m._id} className={`text-sm ${m.sender === "dealer" ? "text-right" : "text-left"}`}>
            <span className="inline-block rounded-xl bg-white px-3 py-2 shadow">
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-4 py-3"
          placeholder="Reply to buyer..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={send} className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
          Send
        </button>
      </div>
    </div>
  );
}