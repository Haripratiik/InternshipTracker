"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Access not allowed</h1>
      <p className="text-muted-foreground text-center mb-6">
        Only allowed email addresses can use this app. Set <code className="bg-muted px-1 rounded">ALLOWED_EMAIL</code> in your .env to your Gmail address (Firebase Auth).
      </p>
      <button
        type="button"
        onClick={handleSignOut}
        className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90"
      >
        Sign out
      </button>
    </main>
  );
}
