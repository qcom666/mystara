"use client";

import Link from "next/link";
import { FavoriteButton } from "@/components/tarot/favorite-button";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getPositionLabel, getPositionMeaning, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";

export function TarotSpreadDetailView({ spread }: { spread: TarotSpread }) {
  const t = useTranslation();
  const { locale } = useLocale();
  const spreadName = getSpreadName(spread, locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Link href="/tarot/spreads" className="text-sm text-silver-400 hover:text-gold-300">
        ← {t.tarotSpreadsPage.backToAllSpreads}
      </Link>

      <h1 className="mt-4 font-display text-3xl text-silver-50">{spreadName}</h1>
      <p className="mt-3 text-silver-400">{getSpreadDescription(spread, locale)}</p>

      <div className="mt-4">
        <FavoriteButton type="SPREAD" targetId={spread.id} />
      </div>

      <div className="mt-8 space-y-3">
        {spread.positions.map((position) => (
          <GlassPanel key={position.id} className="flex items-start gap-4">
            <span className="font-display text-2xl text-gold-400">{position.order}</span>
            <div>
              <h2 className="text-silver-100">{getPositionLabel(position, locale)}</h2>
              <p className="mt-1 text-sm text-silver-400">{getPositionMeaning(position, locale)}</p>
            </div>
          </GlassPanel>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button asChild size="lg">
          <Link href={`/reading/${spread.id}`}>{t.tarotSpreadsPage.startReadingCta.replace("{name}", spreadName)}</Link>
        </Button>
      </div>
    </div>
  );
}
