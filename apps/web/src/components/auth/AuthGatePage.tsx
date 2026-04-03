"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthPhotoPanel } from "@/components/landing/AuthPhotoPanel";
import { useLocale } from "@/i18n/LocaleProvider";

type AuthMode = "login" | "signup";
type SignupStep = "form" | "verify";

function Req() {
  return <span className="text-[var(--sell)]"> *</span>;
}

export function AuthGatePage() {
  const { t } = useLocale();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = searchParams.get("signup");
    if (s === "1" || s === "true") {
      setAuthMode("signup");
      setSignupStep("form");
    }
  }, [searchParams]);

  const goLogin = useCallback(() => {
    setAuthMode("login");
    setErr(null);
    router.replace("/login", { scroll: false });
  }, [router]);

  const goSignup = useCallback(() => {
    setAuthMode("signup");
    setSignupStep("form");
    setErr(null);
    router.replace("/login?signup=1", { scroll: false });
  }, [router]);

  async function onLogin(e: React.FormEvent) {
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
        user?: { id: string; email: string; fullName?: string | null; phone?: string | null };
        error?: unknown;
      };
      if (!r.ok || !j.token || !j.user) {
        setErr(typeof j.error === "string" ? j.error : t("auth.errLogin"));
        return;
      }
      login(j.token, j.user);
      router.push("/trade");
    } finally {
      setBusy(false);
    }
  }

  async function sendVerification(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setDevCodeHint(null);
    if (password.length < 8) {
      setErr(t("auth.errShort"));
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      setErr(t("auth.errRequiredFields"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: unknown; devCode?: string };
      if (!r.ok) {
        if (r.status === 409) {
          setErr(t("auth.err409"));
          return;
        }
        setErr(t("auth.errSendVerification"));
        return;
      }
      if (j.devCode) {
        setDevCodeHint(j.devCode);
      }
      setSignupStep("verify");
      setVerificationCode("");
    } finally {
      setBusy(false);
    }
  }

  async function completeSignup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setErr(t("auth.errInvalidCode"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          verificationCode: verificationCode.trim(),
        }),
      });
      const j = (await r.json()) as {
        token?: string;
        user?: { id: string; email: string; fullName?: string | null; phone?: string | null };
        error?: unknown;
      };
      if (!r.ok || !j.token || !j.user) {
        if (r.status === 409) {
          setErr(t("auth.err409"));
          return;
        }
        if (r.status === 400) {
          if (typeof j.error === "string") {
            setErr(j.error);
            return;
          }
          setErr(t("auth.errInvalidCode"));
          return;
        }
        setErr(t("auth.errGenericSignup"));
        return;
      }
      login(j.token, j.user);
      router.push("/trade");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--header-h))] w-full min-w-0 flex-col overflow-x-clip bg-[var(--landing-bg)]">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col overflow-y-auto lg:flex-row lg:items-stretch lg:overflow-hidden">
        <div className="flex w-full min-h-0 flex-1 flex-col justify-start px-4 py-6 pb-10 sm:justify-center sm:py-10 lg:min-h-[520px] lg:justify-center lg:px-12 lg:py-16">
          <div className="mx-auto w-full max-w-md border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 sm:p-8">
            <div className="mb-6 flex rounded-md border border-[var(--landing-border)] p-1 font-mono text-xs font-medium">
              <button
                type="button"
                onClick={goLogin}
                className={`flex-1 rounded px-3 py-2 transition-colors ${
                  authMode === "login"
                    ? "bg-[var(--gold)] text-[var(--gold-ink)]"
                    : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                }`}
              >
                {t("auth.tabSignIn")}
              </button>
              <button
                type="button"
                onClick={goSignup}
                className={`flex-1 rounded px-3 py-2 transition-colors ${
                  authMode === "signup"
                    ? "bg-[var(--gold)] text-[var(--gold-ink)]"
                    : "text-[var(--landing-muted)] hover:text-[var(--landing-text)]"
                }`}
              >
                {t("auth.tabSignUp")}
              </button>
            </div>

            {authMode === "login" ? (
              <>
                <h1 className="font-mono text-lg font-semibold tracking-wide text-[var(--landing-text)]">
                  {t("auth.loginTitle")}
                </h1>
                <p className="mt-1 font-mono text-[11px] text-[var(--landing-muted)]">{t("auth.loginSub")}</p>
                <form className="mt-6 space-y-4" onSubmit={onLogin}>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.email")}
                      <Req />
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.password")}
                      <Req />
                    </span>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  {err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] bg-[var(--gold)] py-2.5 font-mono text-sm font-semibold text-[var(--gold-ink)] disabled:opacity-50"
                  >
                    {busy ? "…" : t("auth.signinBtn")}
                  </button>
                </form>
                <p className="mt-4 text-center font-mono text-[11px] text-[var(--landing-muted)]">
                  {t("auth.noAccount")}{" "}
                  <button type="button" onClick={goSignup} className="text-[var(--gold)] underline hover:no-underline">
                    {t("auth.createOne")}
                  </button>
                </p>
              </>
            ) : signupStep === "form" ? (
              <>
                <h1 className="font-mono text-lg font-semibold tracking-wide text-[var(--landing-text)]">
                  {t("auth.signupTitle")}
                </h1>
                <p className="mt-1 font-mono text-[11px] text-[var(--landing-muted)]">{t("auth.signupSub")}</p>
                <p className="mt-2 font-mono text-[10px] text-[var(--landing-muted)]">{t("auth.requiredFieldsHint")}</p>
                <form className="mt-4 space-y-4" onSubmit={sendVerification}>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.fullName")}
                      <Req />
                    </span>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.phone")}
                      <Req />
                    </span>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="+1 555 000 0000"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.email")}
                      <Req />
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.password")}
                      <Req />
                    </span>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  {err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] bg-[var(--gold)] py-2.5 font-mono text-sm font-semibold text-[var(--gold-ink)] disabled:opacity-50"
                  >
                    {busy ? "…" : t("auth.sendVerificationCode")}
                  </button>
                </form>
                <p className="mt-4 text-center font-mono text-[11px] text-[var(--landing-muted)]">
                  {t("auth.hasAccount")}{" "}
                  <button type="button" onClick={goLogin} className="text-[var(--gold)] underline hover:no-underline">
                    {t("auth.signinLink")}
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="font-mono text-lg font-semibold tracking-wide text-[var(--landing-text)]">
                  {t("auth.signupTitle")}
                </h1>
                <form className="mt-6 space-y-4" onSubmit={completeSignup}>
                  <h2 className="font-mono text-sm font-semibold text-[var(--landing-text)]">{t("auth.verifyTitle")}</h2>
                  <p className="font-mono text-[11px] leading-relaxed text-[var(--landing-muted)]">
                    {t("auth.verificationSent").replace("{email}", email.trim())}
                  </p>
                  {devCodeHint ? (
                    <p className="rounded border border-[var(--landing-border)] bg-[var(--landing-bg)] p-2 font-mono text-[11px] text-[var(--gold)]">
                      {t("auth.devCodeHint")} <span className="font-bold tracking-widest">{devCodeHint}</span>
                    </p>
                  ) : null}
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {t("auth.verificationCode")}
                      <Req />
                    </span>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="000000"
                      className="mt-1 w-full min-h-[44px] border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 font-mono text-base tracking-[0.35em] text-[var(--landing-text)] outline-none focus:border-[var(--gold)] sm:text-sm"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </label>
                  {err && <p className="font-mono text-xs text-[var(--sell)]">{err}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full min-h-[44px] bg-[var(--gold)] py-2.5 font-mono text-sm font-semibold text-[var(--gold-ink)] disabled:opacity-50"
                  >
                    {busy ? "…" : t("auth.createAccount")}
                  </button>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void sendVerification()}
                      className="font-mono text-[11px] text-[var(--gold)] underline disabled:opacity-50"
                    >
                      {t("auth.resendCode")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setSignupStep("form");
                        setErr(null);
                        setDevCodeHint(null);
                      }}
                      className="font-mono text-[11px] text-[var(--landing-muted)] underline disabled:opacity-50"
                    >
                      {t("auth.backEdit")}
                    </button>
                  </div>
                </form>
                <p className="mt-4 text-center font-mono text-[11px] text-[var(--landing-muted)]">
                  {t("auth.hasAccount")}{" "}
                  <button type="button" onClick={goLogin} className="text-[var(--gold)] underline hover:no-underline">
                    {t("auth.signinLink")}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
        <AuthPhotoPanel />
      </div>
    </div>
  );
}
