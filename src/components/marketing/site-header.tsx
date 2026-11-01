"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Gem,
  Handshake,
  Hash,
  Heart,
  Layers,
  LayoutGrid,
  Library,
  type LucideIcon,
  Menu,
  Orbit,
  Sparkles,
  Star,
  Sun,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "@/components/shared/localized-link";
import { usePathname } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/localized-routes";
import { type CSSProperties, type FocusEvent, type PointerEvent, useEffect, useId, useRef, useState } from "react";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Пункты мобильного меню появляются по очереди; при включённой системной настройке «уменьшить движение» — сразу. */
const listVariants = (reduce: boolean | null): Variants => ({
  hidden: {},
  show: { transition: reduce ? {} : { staggerChildren: 0.035, delayChildren: 0.06 } },
});

const itemVariants = (reduce: boolean | null): Variants => ({
  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: -8 },
  show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.22, ease: "easeOut" } },
});

const DAILY_CARD_HREF = "/tarot/card-of-the-day";
const COMPATIBILITY_HREF = "/astrology/compatibility";

interface NavLeaf {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
}

type NavEntry = { kind: "link"; leaf: NavLeaf } | { kind: "group"; id: "tarot" | "astrology"; label: string; leaves: NavLeaf[] };

/** Мерцающая звёздочка у пункта «Карта дня»: ежедневный раздел заметен в меню, но не кричит. */
function DailyCardSparkle({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("pointer-events-none text-[10px] leading-none text-gold-300 motion-safe:animate-twinkle", className)}>
      ✦
    </span>
  );
}

/** Сердечко у пункта «Вы совместимы?» тихо бьётся (CSS-круг, без работы главного потока). */
function CompatibilityHeart({ className }: { className?: string }) {
  return (
    <Heart
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 shrink-0 fill-gold-400/40 text-gold-300 motion-safe:animate-pulse-scale", className)}
      style={{ "--pulse": 1.2, animationDuration: "1.6s" } as CSSProperties}
    />
  );
}

/** Золотая черта под активным разделом перетекает к новому пункту при переходе (общий layoutId). */
function ActiveUnderline() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      layoutId="site-header-active"
      className="absolute inset-x-0 -bottom-[9px] h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
    />
  );
}

/**
 * Раздел с выпадающей панелью («Таро», «Астрология»). Мышью открывается наведением, с клавиатуры и на сенсорных
 * экранах — нажатием; закрывается по Esc, щелчку мимо и уходу фокуса. Между кнопкой и панелью нет зазора
 * (отступ — внутри обёртки панели), поэтому панель не закрывается, пока к ней ведут мышь.
 */
function NavDropdown({ label, leaves, active, activeHref }: { label: string; leaves: NavLeaf[]; active: boolean; activeHref?: string }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function openNow(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon(event: PointerEvent) {
    if (event.pointerType !== "mouse") return;
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }

  function handleBlur(event: FocusEvent) {
    if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative" onPointerEnter={openNow} onPointerLeave={closeSoon} onBlur={handleBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "focus-ring relative flex items-center gap-1 whitespace-nowrap rounded py-1 text-sm transition-colors hover:text-gold-300",
          active || open ? "text-gold-300" : "text-silver-300",
        )}
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} aria-hidden="true" />
        {active && <ActiveUnderline />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            className="absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.ul
              className="rounded-2xl border border-gold-500/15 bg-midnight-950/95 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85),0_0_40px_-18px_rgba(212,175,55,0.35)] backdrop-blur-xl"
              variants={listVariants(reduceMotion)}
              initial="hidden"
              animate="show"
            >
              {leaves.map((leaf) => {
                const current = leaf.href === activeHref;
                return (
                  <motion.li key={leaf.href} variants={itemVariants(reduceMotion)}>
                    <Link
                      href={leaf.href}
                      aria-current={current ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn("focus-ring group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5", current && "bg-gold-500/10")}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                          current ? "border-gold-400/50 bg-gold-500/15 text-gold-300" : "border-white/10 bg-white/5 text-silver-300 group-hover:border-gold-400/40 group-hover:text-gold-300",
                        )}
                      >
                        <leaf.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-sm", current ? "text-gold-300" : "text-silver-100 group-hover:text-gold-200")}>{leaf.label}</span>
                        {leaf.hint && <span className="mt-0.5 block text-xs text-silver-500">{leaf.hint}</span>}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Подпись верхнего пункта со своим акцентом: звёздочка у «Карты дня», сердечко у «Вы совместимы?». */
function LinkLabel({ leaf, active }: { leaf: NavLeaf; active: boolean }) {
  if (leaf.href === DAILY_CARD_HREF) {
    return (
      <>
        {active ? leaf.label : <span className="text-shimmer-gold">{leaf.label}</span>}
        <DailyCardSparkle className="absolute -right-2.5 -top-1" />
      </>
    );
  }
  if (leaf.href === COMPATIBILITY_HREF) {
    return (
      <span className="flex items-center gap-1.5">
        <CompatibilityHeart />
        {leaf.label}
      </span>
    );
  }
  return <>{leaf.label}</>;
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

  // Верхний уровень — шесть коротких пунктов: «Таро» и «Астрология» раскрываются панелями, ежедневные и самые
  // популярные разделы (карта дня, совместимость) вынесены отдельно. Восемь пунктов в строку не влезали.
  const entries: NavEntry[] = [
    {
      kind: "group",
      id: "tarot",
      label: t.nav.tarot,
      leaves: [
        { href: "/reading", label: t.nav.newReading, hint: t.navHints.newReading, icon: Sparkles },
        { href: "/tarot/cards", label: t.nav.cardMeanings, hint: t.navHints.cardMeanings, icon: Layers },
        { href: "/tarot/spreads", label: t.nav.spreads, hint: t.navHints.spreads, icon: LayoutGrid },
        { href: "/tarot/how-to-read-tarot", label: t.nav.howToRead, hint: t.navHints.howToRead, icon: BookOpen },
        { href: "/tarot", label: t.nav.allTarot, hint: t.navHints.allTarot, icon: Library },
      ],
    },
    { kind: "link", leaf: { href: DAILY_CARD_HREF, label: t.nav.dailyCard, icon: Star } },
    { kind: "link", leaf: { href: COMPATIBILITY_HREF, label: t.nav.compatibility, icon: Heart } },
    {
      kind: "group",
      id: "astrology",
      label: t.nav.astrology,
      leaves: [
        { href: "/astrology", label: t.nav.zodiacSign, hint: t.navHints.zodiacSign, icon: Sun },
        { href: "/astrology/horoscope", label: t.nav.horoscope, hint: t.navHints.horoscope, icon: CalendarDays },
        { href: COMPATIBILITY_HREF, label: t.nav.loveCompatibility, hint: t.navHints.loveCompatibility, icon: Heart },
        { href: `${COMPATIBILITY_HREF}/friendship`, label: t.nav.friendshipCompatibility, hint: t.navHints.friendshipCompatibility, icon: Handshake },
        { href: "/astrology/natal-chart", label: t.nav.natalChart, hint: t.navHints.natalChart, icon: Orbit },
      ],
    },
    { kind: "link", leaf: { href: "/numerology", label: t.nav.numerology, icon: Hash } },
    { kind: "link", leaf: { href: "/pricing", label: t.nav.pricing, icon: Gem } },
  ];

  // На русских адресах (/ru/...) сравниваем с адресом без префикса.
  const currentPath = stripLocalePrefix(pathname);
  const matches = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);
  // Внутри панелей подсвечивается самый длинный подходящий пункт: на странице натальной карты — «Натальная карта».
  const activeHref = entries
    .flatMap((entry) => (entry.kind === "link" ? [entry.leaf] : entry.leaves))
    .filter((leaf) => matches(leaf.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  // Наверху: сначала отдельные пункты (совместимость горит и на странице дружбы), иначе — раздел с панелью.
  const activeEntry =
    entries.find((entry) => entry.kind === "link" && matches(entry.leaf.href)) ??
    entries.find((entry) => entry.kind === "group" && entry.leaves.some((leaf) => matches(leaf.href)));

  // На телефоне избранное (карта дня, совместимость) — первым, затем разделы с подзаголовками, затем остальное.
  const mobileEntries = [
    ...entries.filter((entry) => entry.kind === "link" && (entry.leaf.href === DAILY_CARD_HREF || entry.leaf.href === COMPATIBILITY_HREF)),
    ...entries.filter((entry) => entry.kind === "group"),
    ...entries.filter((entry) => entry.kind === "link" && entry.leaf.href !== DAILY_CARD_HREF && entry.leaf.href !== COMPATIBILITY_HREF),
  ];

  const authenticated = status === "authenticated";
  const isAdmin = authenticated && session?.user?.isAdmin === true;

  const quietLink = "whitespace-nowrap text-sm text-silver-300 transition-colors hover:text-gold-300";

  return (
    <header className="glass-bar sticky top-0 z-40 border-b border-white/5 bg-midnight-950/70 backdrop-blur-lg">
      <div className="relative mx-auto flex h-16 w-full max-w-[1800px] items-center gap-4 px-4 xl:gap-8 xl:px-10">
        <Link href="/" className="shrink-0 py-2 font-display text-2xl text-gold-300">
          Mystara
        </Link>

        {/* Разделы равномерно растянуты по свободному месту между логотипом и блоком действий. Целиком в строку они помещаются от `xl` (1280 px); на планшете и узком ноутбуке работает меню-гамбургер ниже. */}
        <nav className="hidden flex-1 items-center justify-evenly xl:flex">
          {entries.map((entry) =>
            entry.kind === "group" ? (
              <NavDropdown key={entry.id} label={entry.label} leaves={entry.leaves} active={entry === activeEntry} activeHref={activeHref} />
            ) : (
              <Link
                key={entry.leaf.href}
                href={entry.leaf.href}
                aria-current={entry === activeEntry ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap py-1 text-sm transition-colors hover:text-gold-300",
                  entry === activeEntry ? "text-gold-300" : "text-silver-300",
                )}
              >
                <LinkLabel leaf={entry.leaf} active={entry === activeEntry} />
                {entry === activeEntry && <ActiveUnderline />}
              </Link>
            ),
          )}
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
                {/* На 1280–1439 px кнопку заменяет «Новый расклад» в панели «Таро»: так у пунктов меню остаётся воздух. */}
                <Button asChild size="sm" className="hidden min-[1440px]:inline-flex">
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
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto overflow-x-hidden border-t border-white/5 xl:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div className="px-4 py-4" variants={listVariants(reduceMotion)} initial="hidden" animate="show">
              {/* Здесь только наши услуги и тарифы; действия с аккаунтом, например вход, сюда не относятся (для них есть постоянная ссылка рядом с переключателем языка), поэтому список остаётся про «что здесь можно сделать», а не про «кто я». Разделы с панелями на телефоне раскрыты сразу: подзаголовок и пункты под ним. */}
              <nav className="flex flex-col gap-0.5">
                {mobileEntries.map((entry, index) =>
                  entry.kind === "group" ? (
                    <div key={entry.id} className="mt-2">
                      <motion.p variants={itemVariants(reduceMotion)} className="px-1 pb-1 pt-2 text-[11px] uppercase tracking-[0.2em] text-gold-400">
                        {entry.label}
                      </motion.p>
                      {entry.leaves.map((leaf) => (
                        <MobileLink key={leaf.href} leaf={leaf} active={leaf.href === activeHref} onNavigate={() => setOpen(false)} />
                      ))}
                    </div>
                  ) : (
                    <div key={entry.leaf.href} className={cn(index > 0 && mobileEntries[index - 1].kind === "group" && "mt-3 border-t border-white/5 pt-2")}>
                      <MobileLink leaf={entry.leaf} active={entry.leaf.href === activeHref} onNavigate={() => setOpen(false)} />
                    </div>
                  ),
                )}
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

/** Пункт мобильного меню: значок и подпись; у «Карты дня» звёздочка, у совместимости — бьющееся сердечко. */
function MobileLink({ leaf, active, onNavigate }: { leaf: NavLeaf; active: boolean; onNavigate: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div variants={itemVariants(reduceMotion)}>
      <Link
        href={leaf.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex items-center gap-3 rounded-lg px-1 py-2 text-sm", active ? "text-gold-300" : "text-silver-300")}
        onClick={onNavigate}
      >
        {leaf.href === COMPATIBILITY_HREF ? <CompatibilityHeart className="h-4 w-4" /> : <leaf.icon className={cn("h-4 w-4 shrink-0", active ? "text-gold-300" : "text-silver-500")} />}
        {leaf.label}
        {leaf.href === DAILY_CARD_HREF && <DailyCardSparkle />}
      </Link>
    </motion.div>
  );
}
