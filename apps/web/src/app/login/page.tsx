import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGatePage } from "@/components/auth/AuthGatePage";

export const metadata: Metadata = {
  title: "Sign in · Etebaar",
  description:
    "Sign in or create an Etebaar account—spot crypto exchange and market tools, Tbilisi, Georgia.",
};

function AuthFallback() {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-h))] items-center justify-center bg-[var(--landing-bg)] px-4">
      <div className="h-10 w-full max-w-md animate-pulse rounded border border-[var(--landing-border)] bg-[var(--landing-card)]" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthGatePage />
    </Suspense>
  );
}
