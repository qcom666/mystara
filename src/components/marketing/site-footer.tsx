"use client";

import Link from "next/link";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTranslation } from "@/lib/i18n";
import { OPERATOR } from "@/lib/legal/operator";

export function SiteFooter() {
  const t = useTranslation();
  const { isTelegram } = useTelegram();
  if (isTelegram) return null;

  const footerGroups = [
    {
      title: t.footer.groups.product.title,
      links: [
        { href: "/reading", label: t.footer.groups.product.startReading },
        { href: "/numerology", label: t.footer.groups.product.numerology },
        { href: "/astrology", label: t.footer.groups.product.astrology },
        { href: "/tarot/spreads", label: t.footer.groups.product.spreads },
        { href: "/pricing", label: t.footer.groups.product.pricing },
      ],
    },
    {
      title: t.footer.groups.learn.title,
      links: [
        { href: "/tarot", label: t.footer.groups.learn.learnTarot },
        { href: "/tarot/cards", label: t.footer.groups.learn.cardMeanings },
        { href: "/tarot/how-to-read-tarot", label: t.footer.groups.learn.howToRead },
      ],
    },
    {
      title: t.footer.groups.account.title,
      links: [
        { href: "/login", label: t.footer.groups.account.signIn },
        { href: "/account", label: t.nav.account },
        { href: "/readings", label: t.footer.groups.account.myReadings },
        { href: "/favorites", label: t.footer.groups.account.favorites },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <p className="font-display text-xl text-gold-300">Mystara</p>
            <p className="mt-2 max-w-xs text-sm text-silver-500">{t.footer.tagline}</p>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-medium text-silver-300">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-block py-1 text-sm sm:py-0 text-silver-500 transition-colors hover:text-gold-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-xs text-silver-500">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/privacy" className="inline-block py-1.5 transition-colors sm:py-0 hover:text-gold-300">
              {t.legal.policyLink}
            </Link>
            <Link href="/consent" className="inline-block py-1.5 transition-colors sm:py-0 hover:text-gold-300">
              {t.legal.consentLink}
            </Link>
            <Link href="/offer" className="inline-block py-1.5 transition-colors sm:py-0 hover:text-gold-300">
              {t.legal.offerLink}
            </Link>
            <Link href="/contacts" className="inline-block py-1.5 transition-colors sm:py-0 hover:text-gold-300">
              {t.legal.contactsLink}
            </Link>
          </div>
          <p className="mt-3">
            © {new Date().getFullYear()} {t.footer.copyrightSuffix}
          </p>
          {/* Данные продавца показываются, только когда заданы настоящие: текст-заглушка в квадратных скобках не выводится. */}
          {!OPERATOR.name.startsWith("[") && !OPERATOR.registration.startsWith("[") && (
            <p className="mt-2">
              {t.footer.sellerLabel} {OPERATOR.name}, {OPERATOR.registration}
            </p>
          )}
          {/* Мелкий шрифт намеренно: небольшой и приглушённый, чтобы не бросался в глаза, но с читаемым контрастом: нечитаемая оговорка теряла бы смысл. */}
          <p className="mt-4 max-w-3xl text-[11px] leading-snug text-silver-500/80">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
