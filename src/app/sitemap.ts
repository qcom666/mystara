import type { MetadataRoute } from "next";
import { getAllZodiacSigns } from "@/modules/astrology/domain/zodiac-signs.data";
import { allCompatibilitySlugs } from "@/modules/astrology/services/compatibility";
import { LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";
import { getAllCards } from "@/modules/tarot/domain/deck";
import { getAllSpreads } from "@/modules/tarot/domain/spreads.data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_PATHS = [
  "",
  "/reading",
  "/numerology",
  "/astrology",
  "/astrology/horoscope",
  "/astrology/compatibility",
  "/tarot",
  "/tarot/cards",
  "/tarot/spreads",
  "/tarot/how-to-read-tarot",
  "/pricing",
  "/login",
  "/signup",
  "/privacy",
  "/offer",
  "/contacts",
  "/consent",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes = STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, lastModified }));
  const cardRoutes = getAllCards().map((card) => ({ url: `${SITE_URL}/tarot/cards/${card.id}`, lastModified }));
  const spreadRoutes = getAllSpreads().map((spread) => ({ url: `${SITE_URL}/tarot/spreads/${spread.slug}`, lastModified }));
  const lifePathRoutes = Object.keys(LIFE_PATH_MEANINGS).map((number) => ({ url: `${SITE_URL}/numerology/${number}`, lastModified }));
  const zodiacRoutes = getAllZodiacSigns().map((sign) => ({ url: `${SITE_URL}/astrology/${sign.id}`, lastModified }));
  const horoscopeRoutes = getAllZodiacSigns().map((sign) => ({ url: `${SITE_URL}/astrology/horoscope/${sign.id}`, lastModified }));
  const compatibilityRoutes = allCompatibilitySlugs().map((pair) => ({ url: `${SITE_URL}/astrology/compatibility/${pair}`, lastModified }));

  return [...staticRoutes, ...cardRoutes, ...spreadRoutes, ...lifePathRoutes, ...zodiacRoutes, ...horoscopeRoutes, ...compatibilityRoutes];
}
