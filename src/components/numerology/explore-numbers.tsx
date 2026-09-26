"use client";

import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getLifePathMeaning, LIFE_PATH_MEANINGS } from "@/modules/numerology/domain/life-path-meanings.data";

const ALL_NUMBERS = Object.values(LIFE_PATH_MEANINGS)
  .map((meaning) => meaning.number)
  .sort((a, b) => a - b);

// A client component so the titles follow the chosen language, while the rest
// of `numerology/page.tsx` stays a Server Component (and keeps its metadata).
export function ExploreNumbers() {
  const t = useTranslation();
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-silver-500">{t.numerologyPage.exploreHeading}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {ALL_NUMBERS.map((number) => (
          <Link
            key={number}
            href={`/numerology/${number}`}
            className="rounded-full border border-silver-500/25 px-3 py-1 text-sm text-silver-400 transition-colors hover:border-gold-400/40 hover:text-gold-300"
          >
            {number} — {getLifePathMeaning(number, locale).title}
          </Link>
        ))}
      </div>
    </div>
  );
}
