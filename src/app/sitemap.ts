import type { MetadataRoute } from "next";
import { hasRussianVersion, toRussianPath } from "@/lib/i18n/localized-routes";
import { getAllZodiacSigns } from "@/modules/astrology/domain/zodiac-signs.data";
import { allCompatibilitySlugs } from "@/modules/astrology/services/compatibility";
import { LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";
import { getAllCards } from "@/modules/tarot/domain/deck";
import { getAllSpreads } from "@/modules/tarot/domain/spreads.data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_PATHS = [
  "/",
  "/reading",
  "/numerology",
  "/astrology",
  "/astrology/natal-chart",
  "/astrology/horoscope",
  "/astrology/compatibility",
  "/astrology/compatibility/friendship",
  "/tarot",
  "/tarot/cards",
  "/tarot/spreads",
  "/tarot/how-to-read-tarot",
  "/tarot/card-of-the-day",
  "/pricing",
  "/login",
  "/signup",
  "/privacy",
  "/offer",
  "/contacts",
  "/consent",
];

/** Все адреса сайта без языкового префикса. */
function sitemapPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...getAllCards().map((card) => `/tarot/cards/${card.id}`),
    ...getAllSpreads().map((spread) => `/tarot/spreads/${spread.slug}`),
    ...Object.keys(LIFE_PATH_MEANINGS).map((number) => `/numerology/${number}`),
    ...getAllZodiacSigns().map((sign) => `/astrology/${sign.id}`),
    ...getAllZodiacSigns().map((sign) => `/astrology/horoscope/${sign.id}`),
    ...allCompatibilitySlugs().map((pair) => `/astrology/compatibility/${pair}`),
    ...allCompatibilitySlugs().map((pair) => `/astrology/compatibility/friendship/${pair}`),
  ];
}

const absolute = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

/**
 * Карта сайта. У страниц с русской версией (lib/i18n/localized-routes.ts) в карту попадают оба адреса,
 * и у каждого указаны hreflang-альтернативы.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return sitemapPaths().flatMap((path) => {
    if (!hasRussianVersion(path)) return [{ url: absolute(path), lastModified }];
    const alternates = { languages: { en: absolute(path), ru: absolute(toRussianPath(path)) } };
    return [
      { url: absolute(path), lastModified, alternates },
      { url: absolute(toRussianPath(path)), lastModified, alternates },
    ];
  });
}
