"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation } from "@/lib/i18n";
import { getAllSpreads, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";

export function TarotSpreadsContent() {
  const t = useTranslation();
  const { locale } = useLocale();
  const spreads = getAllSpreads();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-3xl text-silver-50 sm:text-4xl">{t.tarotSpreadsPage.title}</h1>
      <p className="mt-3 max-w-2xl text-silver-400">{t.tarotSpreadsPage.subtitle}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {spreads.map((spread) => (
          <Link key={spread.id} href={`/tarot/spreads/${spread.slug}`}>
            <GlassPanel className="h-full transition-colors hover:border-gold-400/40">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl text-silver-100">{getSpreadName(spread, locale)}</h2>
                {spread.isPremium && <Badge variant="gold">{t.common.premiumBadge}</Badge>}
              </div>
              <p className="mt-2 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
              <p className="mt-3 text-xs text-silver-500">
                {formatCardCount(spread.cardCount, locale)} · {t.common.difficulty[spread.difficulty]}
              </p>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
