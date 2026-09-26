"use client";

import { Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTranslation } from "@/lib/i18n";

export function SiteHeader() {
  const t = useTranslation();
  const { status } = useSession();
  const { isTelegram } = useTelegram();
  const [open, setOpen] = useState(false);

  // Telegram's own client chrome (back button, close, title) replaces this —
  // a second nav bar inside the Mini App would just be redundant.
  if (isTelegram) return null;

  const navLinks = [
    { href: "/reading", label: t.nav.newReading },
    { href: "/numerology", label: t.nav.numerology },
    { href: "/astrology", label: t.nav.astrology },
    { href: "/tarot", label: t.nav.learn },
    { href: "/pricing", label: t.nav.pricing },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-midnight-950/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl text-gold-300">
          Mystara
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-silver-300 transition-colors hover:text-gold-300">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {status === "authenticated" ? (
              <>
                <Link href="/readings" className="text-sm text-silver-300 transition-colors hover:text-gold-300">
                  {t.nav.readings}
                </Link>
                <Link href="/favorites" className="text-sm text-silver-300 transition-colors hover:text-gold-300">
                  {t.nav.favorites}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  {t.common.signOut}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-silver-300 transition-colors hover:text-gold-300">
                  {t.common.signIn}
                </Link>
                <Button asChild size="sm">
                  <Link href="/reading">{t.landing.ctaPrimary}</Link>
                </Button>
              </>
            )}
          </div>

          <LanguageSwitcher />

          <button
            type="button"
            className="focus-ring rounded-md p-1 text-silver-200 md:hidden"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-silver-300" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {status === "authenticated" ? (
              <>
                <Link href="/readings" className="text-sm text-silver-300" onClick={() => setOpen(false)}>
                  {t.nav.readings}
                </Link>
                <Link href="/favorites" className="text-sm text-silver-300" onClick={() => setOpen(false)}>
                  {t.nav.favorites}
                </Link>
                <button type="button" className="text-left text-sm text-silver-300" onClick={() => signOut()}>
                  {t.common.signOut}
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm text-silver-300" onClick={() => setOpen(false)}>
                {t.common.signIn}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
