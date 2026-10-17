import type { Metadata } from "next";
import { HoroscopeOverview } from "@/components/astrology/horoscope-view";
import { getAllZodiacSigns } from "@/modules/astrology/domain/zodiac-signs.data";
import { buildDailyHoroscope } from "@/modules/astrology/services/daily-horoscope";
import { getSkyOfDay } from "@/modules/astrology/services/sky-of-day";
import { moscowDay } from "@/modules/tarot/services/daily-card";
import { languageAlternates } from "@/lib/i18n/localized-routes";

// Гороскоп меняется в полночь по Москве: страница пересобирается не реже раза в 10 минут.
export const revalidate = 600;

export const metadata: Metadata = {
  alternates: languageAlternates("/astrology/horoscope", "en"),
  title: "Daily Horoscope for Every Zodiac Sign",
  description: "Today's horoscope for all twelve signs, based on the real position and phase of the Moon.",
};

export default function HoroscopePage() {
  const sky = getSkyOfDay(moscowDay());
  const horoscopes = getAllZodiacSigns().map((sign) => buildDailyHoroscope(sign.id, sky));
  return <HoroscopeOverview sky={sky} horoscopes={horoscopes} />;
}
