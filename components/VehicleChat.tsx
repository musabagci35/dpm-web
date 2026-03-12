"use client";

import { useState } from "react";

export default function VehicleChat({ carId }: { carId: string }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("Hi, is this vehicle still available?");
  const [sending, setSending] = useState(false);

  async function sendLead() {
    setSending(true);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        carId,
        customerName,
        phone,
        email,
        message,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Message failed");
      setSending(false);
      return;
    }

    alert("Lead saved successfully");
    setSending(false);
    setCustomerName("");
    setPhone("");
    setEmail("");
    setMessage("Hi, is this vehicle still available?");
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="text-xl font-semibold">Contact Dealer</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Your name"
          className="rounded-xl border px-4 py-3"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="rounded-xl border px-4 py-3"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="rounded-xl border px-4 py-3 md:col-span-2"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message"
          className="rounded-xl border px-4 py-3 min-h-[140px] md:col-span-2"
        />
      </div>

      <button
        onClick={sendLead}
        disabled={sending}
        className="mt-4 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
      >
        {sending ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}