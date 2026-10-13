"use client";

import { Layers, Moon, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useTranslation } from "@/lib/i18n";
import { setPrivacyConsent, usePrivacyConsent } from "@/lib/legal/use-privacy-consent";

/**
 * Главный экран мини-приложения: заменяет рекламную главную страницу, которая рассчитана на браузерную
 * оболочку, которой в Telegram нет. `SiteHeader` внутри Telegram скрывается, поэтому переключатель языка
 * находится здесь.
 */
export function TelegramHome() {
  const t = useTranslation();
  const { status } = useSession();
  const consent = usePrivacyConsent();

  const modules = [
    { href: "/reading", title: t.telegramHome.tarotTitle, description: t.telegramHome.tarotDescription, icon: Sparkles },
    { href: "/numerology", title: t.nav.numerology, description: t.telegramHome.numerologyDescription, icon: Layers },
    { href: "/astrology", title: t.nav.astrology, description: t.telegramHome.astrologyDescription, icon: Moon },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="mt-2 text-center">
        <p className="font-display text-2xl text-gold-300">Mystara</p>
        <p className="mt-1 text-sm text-silver-400">{t.telegramHome.subtitle}</p>
      </div>

      <div className="mt-8 space-y-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <GlassPanel className="flex items-center gap-4 transition-colors hover:border-gold-400/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10">
                <module.icon className="h-5 w-5 text-gold-400" />
              </div>
              <div>
                <p className="font-display text-lg text-silver-100">{module.title}</p>
                <p className="text-sm text-silver-400">{module.description}</p>
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {status === "authenticated" && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Link href="/account" className="text-center text-sm text-gold-300 hover:underline">
            {t.nav.account}
          </Link>
          <Link href="/readings" className="text-center text-sm text-silver-400 hover:text-gold-300">
            {t.nav.readings}
          </Link>
          <Link href="/favorites" className="text-center text-sm text-silver-400 hover:text-gold-300">
            {t.nav.favorites}
          </Link>
        </div>
      )}

      {consent === "declined" && status === "unauthenticated" && (
        <button
          type="button"
          onClick={() => setPrivacyConsent("accepted")}
          className="mt-8 block w-full text-center text-sm text-gold-300 hover:underline"
        >
          {t.legal.telegramReconsent}
        </button>
      )}

      <div className="mt-10 text-[11px] leading-snug text-silver-500/80">
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-center">
          <Link href="/privacy" className="hover:text-gold-300">
            {t.legal.policyLink}
          </Link>
          <Link href="/consent" className="hover:text-gold-300">
            {t.legal.consentLink}
          </Link>
          <Link href="/offer" className="hover:text-gold-300">
            {t.legal.offerLink}
          </Link>
          <Link href="/contacts" className="hover:text-gold-300">
            {t.legal.contactsLink}
          </Link>
        </p>
        <p className="mt-3">{t.footer.disclaimer}</p>
      </div>
    </div>
  );
}
