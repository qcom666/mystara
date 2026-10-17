"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import { setPrivacyConsent, usePrivacyConsent } from "@/lib/legal/use-privacy-consent";
import { useTelegram } from "./telegram-provider";

const LEGAL_PATHS = new Set(["/privacy", "/consent"]);

/**
 * Внутри Telegram аккаунт создаётся автоматически из профиля Telegram, поэтому согласие нужно спросить
 * ДО этого. Пока выбор не сделан, экран заменяет приложение; сами юридические документы остаются
 * доступными, чтобы пользователь мог прочитать, с чем соглашается.
 */
export function TelegramConsentGate({ children }: { children: ReactNode }) {
  const { isTelegram } = useTelegram();
  const consent = usePrivacyConsent();
  const pathname = usePathname();

  if (!isTelegram || consent !== "unknown" || LEGAL_PATHS.has(pathname)) return <>{children}</>;
  return <TelegramConsentScreen />;
}

function TelegramConsentScreen() {
  const t = useTranslation();
  const { status } = useSession();
  const linkClass = "text-gold-300 underline-offset-2 hover:underline";

  function handleDecline() {
    setPrivacyConsent("declined");
    // Сессия, оставшаяся с тех времён, когда согласие не спрашивали, не должна продолжать сохранять данные.
    if (status === "authenticated") void signOut({ redirect: false });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-3 flex justify-end">
        <LanguageSwitcher />
      </div>
      <GlassPanel>
        <p className="font-display text-2xl text-gold-300">Mystara</p>
        <h1 className="mt-4 font-display text-xl text-silver-50">{t.legal.telegramTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{t.legal.telegramBody}</p>
        <p className="mt-3 text-xs leading-relaxed text-silver-400">
          <Link href="/consent" className={linkClass}>
            {t.legal.consentLink}
          </Link>
          {" · "}
          <Link href="/privacy" className={linkClass}>
            {t.legal.policyLink}
          </Link>
        </p>
        <div className="mt-6 space-y-2.5">
          <Button className="w-full" onClick={() => setPrivacyConsent("accepted")}>
            {t.legal.telegramAcceptCta}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleDecline}>
            {t.legal.telegramGuestCta}
          </Button>
        </div>
      </GlassPanel>
      <p className="mt-6 text-[11px] leading-snug text-silver-500/80">{t.footer.disclaimer}</p>
    </div>
  );
}
