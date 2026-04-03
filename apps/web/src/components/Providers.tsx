"use client";

import { AuthProvider } from "@/components/AuthProvider";
import { FloatingTelegramHelp } from "@/components/FloatingTelegramHelp";
import { LocaleProvider } from "@/i18n/LocaleProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        {children}
        <FloatingTelegramHelp />
      </AuthProvider>
    </LocaleProvider>
  );
}
