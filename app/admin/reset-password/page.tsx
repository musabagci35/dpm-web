"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError("");

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset your password.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-green-700 font-semibold">
          Your password has been reset. Every previous session has been signed out.
        </p>
        <Link href="/admin/login" className="text-blue-700 font-bold underline">
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-100 text-red-600 p-2 rounded text-sm">{error}</div>}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="New password"
          className="border p-3 w-full rounded-lg pr-20"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password && (
          <button
            type="button"
            onClick={() => setPassword("")}
            aria-label="Clear password"
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
          >
            ✕
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? "🙈" : "👁"}
        </button>
      </div>

      <input
        type={showPassword ? "text" : "password"}
        placeholder="Confirm new password"
        className="border p-3 w-full rounded-lg"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold disabled:opacity-60"
      >
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset Admin Password</h1>
          <p className="text-gray-500 text-sm">Drive Prime Motors staff access</p>
        </div>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
