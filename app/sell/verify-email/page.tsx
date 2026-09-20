"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailBody() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<"checking" | "success" | "error">("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setError("This verification link is missing its token.");
      return;
    }

    fetch("/api/marketplace/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not verify this email.");
          setState("error");
          return;
        }
        setState("success");
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setState("error");
      });
  }, [token]);

  if (state === "checking") {
    return <p className="text-gray-600 text-center">Verifying your email…</p>;
  }

  if (state === "error") {
    return (
      <div className="text-center space-y-4">
        <p className="text-red-600 font-semibold">{error}</p>
        <Link href="/sell/login" className="text-blue-700 font-bold underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <p className="text-green-700 font-semibold">Your email is verified.</p>
      <Link href="/sell/login" className="text-blue-700 font-bold underline">
        Sign in
      </Link>
    </div>
  );
}

export default function SellerVerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Email Verification</h1>
          <p className="text-gray-500 text-sm">Drive Prime Motors — Sell My Car</p>
        </div>
        <Suspense fallback={null}>
          <VerifyEmailBody />
        </Suspense>
      </div>
    </div>
  );
}
