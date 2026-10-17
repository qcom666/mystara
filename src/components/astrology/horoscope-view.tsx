"use client";

import Link from "@/components/shared/localized-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SIGN_LOCATIVE_RU } from "@/modules/astrology/domain/horoscope.data";
import { getZodiacSignById, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";
import type { ZodiacSignId } from "@/modules/astrology/domain/types";
import type { DailyHoroscope, HoroscopeRatings, SkyOfDay } from "@/modules/astrology/services/daily-horoscope";

function signOf(id: ZodiacSignId, locale: Locale) {
  const base = getZodiacSignById(id);
  return base ? localizeZodiacSign(base, locale) : null;
}

/** «17 октября» / «October 17» из московского дня «ГГГГ-ММ-ДД», без сдвига часового пояса браузера. */
function formatDay(day: string, locale: Locale): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, date)),
  );
}

/** Символ знака текстом, а не цветным эмодзи (U+FE0E), как в остальном оформлении. */
const asText = (symbol: string | undefined) => (symbol ? `${symbol}\uFE0E` : "");

function englishOrdinal(n: number): string {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function SkyOfDayBadges({ sky }: { sky: SkyOfDay }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const moonSign = signOf(sky.moonSign, locale);
  const moonLabel = locale === "ru" ? SIGN_LOCATIVE_RU[sky.moonSign] : moonSign?.name ?? sky.moonSign;
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      <Badge variant="gold">
        {asText(moonSign?.symbol)} {t.horoscopePage.moonIn.replace("{sign}", moonLabel)}
      </Badge>
      <Badge variant="violet">{t.horoscopePage.phases[sky.moonPhase]}</Badge>
      <Badge variant={sky.mercuryRetrograde ? "gold" : "outline"}>
        {sky.mercuryRetrograde ? t.horoscopePage.mercuryRetrograde : t.horoscopePage.mercuryDirect}
      </Badge>
    </div>
  );
}

function RatingRow({ ratings }: { ratings: HoroscopeRatings }) {
  const t = useTranslation();
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      {(["love", "work", "energy"] as const).map((key) => (
        <div key={key}>
          <dt className="text-xs uppercase tracking-[0.15em] text-silver-500">{t.horoscopePage.ratings[key]}</dt>
          <dd className="mt-1 text-gold-300" aria-label={`${ratings[key]} / 5`}>
            {"●".repeat(ratings[key])}
            <span className="text-midnight-600">{"●".repeat(5 - ratings[key])}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Страница со всеми знаками: небо дня и короткая тема для каждого. */
export function HoroscopeOverview({ sky, horoscopes }: { sky: SkyOfDay; horoscopes: DailyHoroscope[] }) {
  const t = useTranslation();
  const { locale } = useLocale();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.horoscopePage.eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50 sm:text-4xl">{t.horoscopePage.title}</h1>
        <p className="mt-1 text-sm text-silver-400">{formatDay(sky.day, locale)}</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-silver-400">{t.horoscopePage.subtitle}</p>
        <div className="mt-4">
          <SkyOfDayBadges sky={sky} />
        </div>
      </div>

      <GlassPanel className="mt-8">
        <h2 className="font-display text-lg text-silver-100">{t.horoscopePage.moodHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">
          {horoscopes[0]?.mood[locale]} {horoscopes[0]?.phase[locale]}
        </p>
        {horoscopes[0]?.mercury && <p className="mt-2 text-sm text-gold-300">{horoscopes[0].mercury[locale]}</p>}
      </GlassPanel>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {horoscopes.map((horoscope) => {
          const sign = signOf(horoscope.sign, locale);
          if (!sign) return null;
          return (
            <Link key={horoscope.sign} href={`/astrology/horoscope/${horoscope.sign}`} className="group">
              <GlassPanel padding="sm" className="h-full transition-colors group-hover:border-gold-400/40">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg text-silver-100">
                    <span className="text-gold-300">{asText(sign.symbol)}</span> {sign.name}
                  </h2>
                  <span className="text-xs text-gold-300 group-hover:underline">{t.horoscopePage.readMore} →</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-silver-400">{horoscope.theme[locale]}</p>
              </GlassPanel>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-silver-500">
        {t.horoscopePage.updatesDaily} {t.astrologyPage.disclaimer}
      </p>
      <div className="mt-6 text-center">
        <Button asChild variant="secondary">
          <Link href="/astrology/compatibility">{t.horoscopePage.compatibilityCta}</Link>
        </Button>
      </div>
    </div>
  );
}

/** Гороскоп одного знака на сегодня. */
export function HoroscopeSignView({ sky, horoscope }: { sky: SkyOfDay; horoscope: DailyHoroscope }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const sign = signOf(horoscope.sign, locale);
  if (!sign) return null;
  const houseLabel = t.horoscopePage.house.replace("{n}", locale === "ru" ? String(horoscope.house) : englishOrdinal(horoscope.house));

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/astrology/horoscope" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.horoscopePage.allSigns}
      </Link>

      <div className="mt-6 text-center">
        <p className="font-display text-6xl text-gradient-gold">{asText(sign.symbol)}</p>
        <h1 className="mt-2 font-display text-3xl text-silver-50">{t.horoscopePage.signTitle.replace("{name}", sign.name)}</h1>
        <p className="mt-1 text-sm text-silver-400">{formatDay(sky.day, locale)}</p>
        <div className="mt-4">
          <SkyOfDayBadges sky={sky} />
        </div>
      </div>

      <GlassPanel className="mt-8">
        <RatingRow ratings={horoscope.ratings} />
      </GlassPanel>

      <GlassPanel className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg text-silver-100">{t.horoscopePage.themeHeading}</h2>
          <span className="text-xs text-silver-500">{houseLabel}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{horoscope.theme[locale]}</p>
      </GlassPanel>

      <GlassPanel className="mt-4">
        <h2 className="font-display text-lg text-silver-100">{t.horoscopePage.moodHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">
          {horoscope.mood[locale]} {horoscope.phase[locale]}
        </p>
        {horoscope.mercury && <p className="mt-2 text-sm text-gold-300">{horoscope.mercury[locale]}</p>}
      </GlassPanel>

      <GlassPanel className="mt-4">
        <h2 className="font-display text-lg text-silver-100">{t.horoscopePage.adviceHeading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{horoscope.advice[locale]}</p>
      </GlassPanel>

      <p className="mt-6 text-center text-xs text-silver-500">
        {t.horoscopePage.updatesDaily} {t.astrologyPage.disclaimer}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href={`/astrology/compatibility?sign=${horoscope.sign}`}>{t.horoscopePage.compatibilityCta}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/astrology/${horoscope.sign}`}>{t.horoscopePage.signCta}</Link>
        </Button>
      </div>
    </div>
  );
}
