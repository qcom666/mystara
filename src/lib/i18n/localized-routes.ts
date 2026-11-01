import type { Locale } from "./dictionaries";

/**
 * Русские адреса для поисковиков: страницы из списка ниже есть и по `/ru/...`. Там язык задаёт сам адрес
 * (сервер сразу отдаёт русский HTML, включая шапку и подвал), а на обычных адресах язык по-прежнему
 * выбирает посетитель (localStorage). Остальные страницы (кабинет, вход, админка) существуют только в
 * одном экземпляре и переводятся на клиенте.
 */

export const RU_PREFIX = "/ru";

const SIGN = "(?:aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)";

const RU_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/reading$/,
  /^\/pricing$/,
  /^\/tarot$/,
  /^\/tarot\/how-to-read-tarot$/,
  /^\/tarot\/card-of-the-day$/,
  /^\/tarot\/cards(\/[a-z0-9-]+)?$/,
  /^\/tarot\/spreads(\/[a-z0-9-]+)?$/,
  /^\/numerology(\/\d+)?$/,
  new RegExp(`^/astrology(/${SIGN})?$`),
  /^\/astrology\/natal-chart$/,
  new RegExp(`^/astrology/horoscope(/${SIGN})?$`),
  new RegExp(`^/astrology/compatibility(/${SIGN}-${SIGN})?$`),
  new RegExp(`^/astrology/compatibility/friendship(/${SIGN}-${SIGN})?$`),
];

/** Язык, заданный адресом: «ru» для `/ru` и `/ru/...`, иначе null (язык выбирает посетитель). */
export function localeFromPathname(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  return pathname === RU_PREFIX || pathname.startsWith(`${RU_PREFIX}/`) ? "ru" : null;
}

/** Адрес без языкового префикса: `/ru/tarot` → `/tarot`, `/ru` → `/`. */
export function stripLocalePrefix(pathname: string): string {
  if (localeFromPathname(pathname) !== "ru") return pathname;
  return pathname.slice(RU_PREFIX.length) || "/";
}

/** Есть ли у страницы (адрес без префикса) русская версия по `/ru/...`. */
export function hasRussianVersion(pathname: string): boolean {
  return RU_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

/** Русский адрес страницы: `/tarot` → `/ru/tarot`, `/` → `/ru`. */
export function toRussianPath(pathname: string): string {
  return pathname === "/" ? RU_PREFIX : `${RU_PREFIX}${pathname}`;
}

/**
 * Ссылка с учётом языка: у русскоязычного посетителя ведёт на русскую версию, если она есть. Внешние
 * ссылки, якоря и адреса без русской версии не меняются; строка запроса и якорь сохраняются.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (locale !== "ru" || !href.startsWith("/") || href.startsWith("//")) return href;
  const match = /^([^?#]*)(.*)$/.exec(href);
  const path = match?.[1] ?? href;
  const rest = match?.[2] ?? "";
  if (localeFromPathname(path) === "ru" || !hasRussianVersion(path)) return href;
  return `${toRussianPath(path)}${rest}`;
}

/**
 * `alternates` для metadata: канонический адрес текущей версии и hreflang на обе. `x-default` — английская
 * версия: на ней язык выбирает сам посетитель.
 */
export function languageAlternates(pathname: string, current: Locale) {
  const english = pathname;
  const russian = toRussianPath(pathname);
  return {
    canonical: current === "ru" ? russian : english,
    languages: { en: english, ru: russian, "x-default": english },
  };
}
