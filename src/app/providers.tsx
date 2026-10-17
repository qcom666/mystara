"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ConsentSync } from "@/components/legal/consent-sync";
import { ReferralCapture } from "@/components/shared/referral-capture";
import { TelegramBackButton } from "@/components/telegram/telegram-back-button";
import { TelegramConsentGate } from "@/components/telegram/telegram-consent-gate";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <SessionProvider>
        <TelegramProvider>
          <TelegramBackButton />
          <ConsentSync />
          <ReferralCapture />
          <TelegramConsentGate>{children}</TelegramConsentGate>
        </TelegramProvider>
      </SessionProvider>
    </LanguageProvider>
  );
}
