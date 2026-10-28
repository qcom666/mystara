"use client";

import { MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ConsentSync } from "@/components/legal/consent-sync";
import { ReferralCapture } from "@/components/shared/referral-capture";
import { TelegramBackButton } from "@/components/telegram/telegram-back-button";
import { TelegramConsentGate } from "@/components/telegram/telegram-consent-gate";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { LanguageProvider } from "@/lib/i18n";
import { usePerfMonitor } from "@/lib/perf";

export function Providers({ children }: { children: ReactNode }) {
  // Замер кадров после загрузки: на слабом устройстве включает облегчённый режим (lib/perf.ts).
  usePerfMonitor();
  return (
    <LanguageProvider>
      {/* «Уменьшить движение» в системе: сдвиги и повороты framer-motion отключаются на всём сайте. */}
      <MotionConfig reducedMotion="user">
      <SessionProvider>
        <TelegramProvider>
          <TelegramBackButton />
          <ConsentSync />
          <ReferralCapture />
          <TelegramConsentGate>{children}</TelegramConsentGate>
        </TelegramProvider>
      </SessionProvider>
      </MotionConfig>
    </LanguageProvider>
  );
}
