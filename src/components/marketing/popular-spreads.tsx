"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadById, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";

const FEATURED_IDS = ["three-card", "celtic-cross", "love", "career"];

export function PopularSpreads() {
  const t = useTranslation();
  const { locale } = useLocale();
  const spreads = FEATURED_IDS.map((id) => getSpreadById(id)).filter((spread): spread is TarotSpread => Boolean(spread));

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.spreads.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.spreads.title}</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {spreads.map((spread) => (
            <Link key={spread.id} href={`/reading/${spread.id}`}>
              <GlassPanel className="h-full transition-colors hover:border-gold-400/40">
                <h3 className="font-display text-lg text-silver-100">{getSpreadName(spread, locale)}</h3>
                <p className="mt-2 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
                <p className="mt-3 text-xs text-silver-500">{formatCardCount(spread.cardCount, locale)}</p>
              </GlassPanel>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
