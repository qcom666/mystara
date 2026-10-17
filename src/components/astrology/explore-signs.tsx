"use client";

import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getAllZodiacSigns, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";

// Клиентский компонент, чтобы названия знаков следовали выбранному языку, а остальная часть
// `astrology/page.tsx` осталась серверным компонентом (и сохранила metadata).
export function ExploreSigns() {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 text-center">
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <Link href="/astrology/horoscope" className="rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm text-gold-300 transition-colors hover:border-gold-400/60">
          {t.astrologyPage.horoscopeLink}
        </Link>
        <Link href="/astrology/compatibility" className="rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm text-gold-300 transition-colors hover:border-gold-400/60">
          {t.astrologyPage.compatibilityLink}
        </Link>
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-silver-500">{t.astrologyPage.exploreHeading}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {getAllZodiacSigns().map((base) => {
          const sign = localizeZodiacSign(base, locale);
          return (
            <Link
              key={sign.id}
              href={`/astrology/${sign.id}`}
              className="rounded-full border border-silver-500/25 px-3 py-2 text-sm sm:py-1 text-silver-400 transition-colors hover:border-gold-400/40 hover:text-gold-300"
            >
              {`${sign.symbol}\uFE0E`} {sign.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
