"use client";

import { Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const t = useTranslation();
  const { data: session, status } = useSession();
  const { isTelegram } = useTelegram();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Собственная оболочка клиента Telegram (кнопка «Назад», закрытие, заголовок) заменяет эту шапку:
  // вторая панель навигации внутри мини-приложения была бы лишней.
  if (isTelegram) return null;

  const navLinks = [
    { href: "/reading", label: t.nav.newReading },
    { href: "/numerology", label: t.nav.numerology },
    { href: "/astrology", label: t.nav.astrology },
    { href: "/astrology/natal-chart", label: t.nav.natalChart },
    { href: "/tarot", label: t.nav.learn },
    { href: "/pricing", label: t.nav.pricing },
  ];

  // Подсвечивается самый длинный подходящий раздел: на странице натальной карты горит «Натальная карта», а не «Астрология».
  const activeHref = navLinks
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const authenticated = status === "authenticated";
  const isAdmin = authenticated && session?.user?.isAdmin === true;

  const quietLink = "whitespace-nowrap text-sm text-silver-300 transition-colors hover:text-gold-300";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-midnight-950/70 backdrop-blur-lg">
      {/* От 1800 px меню стоит ровно по центру страницы (боковые блоки разной ширины центр не сдвигают). Ниже этого порога оно растянуто между логотипом и блоком справа с одинаковыми промежутками. */}
      <div className="relative mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-4 xl:gap-8 xl:px-10">
        <Link href="/" className="shrink-0 py-2 font-display text-2xl text-gold-300">
          Mystara
        </Link>

        {/* Разделы равномерно растянуты по свободному месту между логотипом и блоком действий. Целиком в строку они помещаются от `xl` (1280 px); на планшете и узком ноутбуке работает меню-гамбургер ниже. */}
        <nav className="hidden flex-1 items-center justify-evenly xl:flex min-[1800px]:absolute min-[1800px]:left-1/2 min-[1800px]:top-1/2 min-[1800px]:w-[50rem] min-[1800px]:-translate-x-1/2 min-[1800px]:-translate-y-1/2 min-[1800px]:flex-none min-[1800px]:justify-between">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.href === activeHref ? "page" : undefined}
              className={cn(
                "whitespace-nowrap py-1 text-sm transition-colors hover:text-gold-300",
                link.href === activeHref ? "text-gold-300 underline decoration-gold-400/70 decoration-1 underline-offset-[10px]" : "text-silver-300",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4 xl:gap-5">
          <div className="hidden items-center gap-5 xl:flex">
            {authenticated ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className={quietLink}>
                    {t.nav.admin}
                  </Link>
                )}
                <Link
                  href="/account"
                  className="whitespace-nowrap rounded-full border border-gold-500/40 px-4 py-1.5 text-sm text-gold-300 transition-colors hover:bg-gold-500/10"
                >
                  {t.nav.account}
                </Link>
                <button type="button" className={cn(quietLink, "focus-ring rounded")} onClick={() => signOut()}>
                  {t.common.signOut}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={quietLink}>
                  {t.common.signIn}
                </Link>
                <Button asChild size="sm">
                  <Link href="/reading">{t.landing.ctaPrimary}</Link>
                </Button>
              </>
            )}
          </div>

          <span aria-hidden className="hidden h-5 w-px bg-white/10 xl:block" />

          {!authenticated && (
            <Link href="/login" className={cn(quietLink, "inline-flex h-10 items-center xl:hidden")}>
              {t.common.signIn}
            </Link>
          )}

          <LanguageSwitcher />

          <button
            type="button"
            className="focus-ring rounded-md p-2 text-silver-200 xl:hidden"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/5 px-4 py-4 xl:hidden">
          {/* Здесь только наши услуги и тарифы; действия с аккаунтом, например вход, сюда не относятся (для них есть постоянная ссылка рядом с переключателем языка), поэтому список остаётся про «что здесь можно сделать», а не про «кто я». */}
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.href === activeHref ? "page" : undefined}
                className={cn("text-sm", link.href === activeHref ? "text-gold-300" : "text-silver-300")}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {authenticated && (
            <nav className="mt-4 flex flex-col gap-4 border-t border-white/5 pt-4">
              <Link href="/account" className="text-sm text-gold-300" onClick={() => setOpen(false)}>
                {t.nav.account}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-silver-300" onClick={() => setOpen(false)}>
                  {t.nav.admin}
                </Link>
              )}
              <button type="button" className="text-left text-sm text-silver-300" onClick={() => signOut()}>
                {t.common.signOut}
              </button>
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
