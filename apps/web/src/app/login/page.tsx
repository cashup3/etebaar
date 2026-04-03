"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthPhotoPanel } from "@/components/landing/AuthPhotoPanel";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = (await r.json()) as {
        token?: string;
        user?: { id: string; email: string };
        error?: unknown;
      };
      if (!r.ok || !j.token || !j.user) {
        setErr(typeof j.error === "string" ? j.error : "Login failed");
        return;
      }
      login(j.token, j.user);
      router.push("/trade");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-h))] bg-[var(--landing-bg)]">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-10 lg:flex-row lg:items-stretch lg:gap-0 lg:px-0 lg:py-0">
        <div className="flex flex-1 flex-col justify-center lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-md border border-[var(--landing-border)] bg-[var(--landing-card)] p-8">
            <h1 className="font-mono text-lg font-semibold tracking-wide text-[var(--landing-text)]">
              Sign in
            </h1>
            <p className="mt-1 font-mono text-[11px] text-[var(--landing-muted)]">
              Etebaar spot — use the account you registered here.
            </p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 w-full border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-sm text-[var(--landing-text)] outline-none focus:border-[var(--gold)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                  Password
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-1 w-full border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-sm text-[var(--landing-text)] outline-none focus:border-[var(--gold)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[var(--gold)] py-2.5 font-mono text-sm font-semibold text-[var(--gold-ink)] disabled:opacity-50"
              >
                {busy ? "…" : "Sign in"}
              </button>
            </form>
            <p className="mt-4 text-center font-mono text-[11px] text-[var(--landing-muted)]">
              No account?{" "}
              <Link href="/signup" className="text-[var(--gold)] hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
        <AuthPhotoPanel />
      </div>
    </div>
  );
}
