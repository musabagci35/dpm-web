"use client";

import { useState } from "react";
import { useEffect } from "react";
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (res.ok) {
        window.location.replace("/admin/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">

        <div className="text-center">
          <h1 className="text-2xl font-bold">Drive Prime Motors</h1>
          <p className="text-gray-500 text-sm">Admin Panel</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-3 w-full rounded-lg"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-3 w-full rounded-lg"
          onChange={(e) => setPassword(e.target.value)}
        />

<button
  type="button"   // 🔥 EKLE
  onClick={handleLogin}
  disabled={loading}
  className="w-full bg-black text-white py-3 rounded-lg"
>
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}