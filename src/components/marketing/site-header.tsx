"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/localized-routes";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Пункты мобильного меню появляются по очереди; при включённой системной настройке «уменьшить движение» — сразу. */
const listVariants = (reduce: boolean | null): Variants => ({
  hidden: {},
  show: { transition: reduce ? {} : { staggerChildren: 0.045, delayChildren: 0.06 } },
});

const itemVariants = (reduce: boolean | null): Variants => ({
  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.22, ease: "easeOut" } },
});

const DAILY_CARD_HREF = "/tarot/card-of-the-day";

/** Мерцающая звёздочка у пункта «Карта дня»: новый ежедневный раздел заметен в меню, но не кричит. */
function DailyCardSparkle({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none text-[10px] leading-none text-gold-300 motion-safe:animate-twinkle", className)}>
      ✦
    </span>
  );
}

export function SiteHeader() {
  const t = useTranslation();
  const { data: session, status } = useSession();
  const { isTelegram } = useTelegram();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Собственная оболочка клиента Telegram (кнопка «Назад», закрытие, заголовок) заменяет эту шапку:
  // вторая панель навигации внутри мини-приложения была бы лишней.
  if (isTelegram) return null;

  const navLinks = [
    { href: "/reading", label: t.nav.newReading },
    { href: DAILY_CARD_HREF, label: t.nav.dailyCard },
    { href: "/numerology", label: t.nav.numerology },
    { href: "/astrology", label: t.nav.astrology },
    { href: "/astrology/natal-chart", label: t.nav.natalChart },
    { href: "/tarot", label: t.nav.learn },
    { href: "/pricing", label: t.nav.pricing },
  ];

  // Подсвечивается самый длинный подходящий раздел: на странице натальной карты горит «Натальная карта», а не «Астрология».
  // На русских адресах (/ru/...) сравниваем с адресом без префикса.
  const currentPath = stripLocalePrefix(pathname);
  const activeHref = navLinks
    .filter((link) => currentPath === link.href || currentPath.startsWith(`${link.href}/`))
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
                "relative whitespace-nowrap py-1 text-sm transition-colors hover:text-gold-300",
                link.href === activeHref ? "text-gold-300" : "text-silver-300",
              )}
            >
              {link.href === DAILY_CARD_HREF && link.href !== activeHref ? <span className="text-shimmer-gold">{link.label}</span> : link.label}
              {link.href === DAILY_CARD_HREF && <DailyCardSparkle className="absolute -right-2.5 -top-1" />}
              {/* Подчёркивание активного раздела перетекает к новому пункту при переходе (общий layoutId). */}
              {link.href === activeHref && (
                <motion.span
                  layoutId="site-header-active"
                  className="absolute inset-x-0 -bottom-[9px] h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent"
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
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
                {/* С 7 пунктами меню на ширине 1280–1535 px этой кнопке не хватает места; там её заменяет пункт «Новый расклад». */}
                <Button asChild size="sm" className="hidden 2xl:inline-flex">
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
            aria-label={open ? t.common.closeMenu : t.common.openMenu}
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "menu"}
                className="block"
                initial={reduceMotion ? false : { rotate: open ? -80 : 80, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { rotate: open ? 80 : -80, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
              >
                {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            className="overflow-hidden border-t border-white/5 xl:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div className="px-4 py-4" variants={listVariants(reduceMotion)} initial="hidden" animate="show">
          {/* Здесь только наши услуги и тарифы; действия с аккаунтом, например вход, сюда не относятся (для них есть постоянная ссылка рядом с переключателем языка), поэтому список остаётся про «что здесь можно сделать», а не про «кто я». */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <motion.div key={link.href} variants={itemVariants(reduceMotion)}>
                <Link
                  href={link.href}
                  aria-current={link.href === activeHref ? "page" : undefined}
                  className={cn("flex items-center gap-1.5 py-2 text-sm", link.href === activeHref ? "text-gold-300" : "text-silver-300")}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.href === DAILY_CARD_HREF && <DailyCardSparkle />}
                </Link>
              </motion.div>
            ))}
          </nav>
          {authenticated && (
            <nav className="mt-3 flex flex-col gap-1 border-t border-white/5 pt-3">
              <motion.div variants={itemVariants(reduceMotion)}>
                <Link href="/account" className="block py-2 text-sm text-gold-300" onClick={() => setOpen(false)}>
                  {t.nav.account}
                </Link>
              </motion.div>
              {isAdmin && (
                <motion.div variants={itemVariants(reduceMotion)}>
                  <Link href="/admin" className="block py-2 text-sm text-silver-300" onClick={() => setOpen(false)}>
                    {t.nav.admin}
                  </Link>
                </motion.div>
              )}
              <motion.div variants={itemVariants(reduceMotion)}>
                <button type="button" className="block w-full py-2 text-left text-sm text-silver-300" onClick={() => signOut()}>
                  {t.common.signOut}
                </button>
              </motion.div>
            </nav>
          )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
