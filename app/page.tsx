"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUserEmail(data.user?.email ?? null);
      })
      .catch(() => setUserEmail(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignIn() {
    setSigningIn(true);
    setError(null);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }
        setError(data.error ?? "Sign-in failed.");
        setSigningIn(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setSigningIn(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground mb-2">
        Internship Tracker
      </h1>
      <p className="text-muted-foreground mb-8">
        Job discovery and application tracker — sign in to continue
      </p>
      {userEmail ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{userEmail}</span>
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Open Dashboard
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {signingIn ? "Signing in…" : "Sign in with Google"}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </main>
  );
}
