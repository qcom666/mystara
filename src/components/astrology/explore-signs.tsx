"use client";

import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getAllZodiacSigns, localizeZodiacSign } from "@/modules/astrology/domain/zodiac-signs.data";

// A client component so the sign names follow the chosen language, while the
// rest of `astrology/page.tsx` stays a Server Component (and keeps its metadata).
export function ExploreSigns() {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-silver-500">{t.astrologyPage.exploreHeading}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {getAllZodiacSigns().map((base) => {
          const sign = localizeZodiacSign(base, locale);
          return (
            <Link
              key={sign.id}
              href={`/astrology/${sign.id}`}
              className="rounded-full border border-silver-500/25 px-3 py-1 text-sm text-silver-400 transition-colors hover:border-gold-400/40 hover:text-gold-300"
            >
              {sign.symbol} {sign.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
