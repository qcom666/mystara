"use client";

import Link from "@/components/shared/localized-link";
import { GlassPanel } from "@/components/ui/glass-panel";
import { formatCardCount, useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadById, getSpreadDescription, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { RevealGroup, RevealItem, SectionHeading, SpotlightCard } from "@/components/motion/reveal";

const FEATURED_IDS = ["three-card", "celtic-cross", "love", "career"];

export function PopularSpreads() {
  const t = useTranslation();
  const { locale } = useLocale();
  const spreads = FEATURED_IDS.map((id) => getSpreadById(id)).filter((spread): spread is TarotSpread => Boolean(spread));

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={t.marketing.spreads.eyebrow} title={t.marketing.spreads.title} />
        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12} delay={0.2}>
          {spreads.map((spread) => (
            <RevealItem key={spread.id} className="h-full">
              <Link href={`/reading/${spread.id}`} className="block h-full transition-transform duration-300 ease-out hover:-translate-y-1.5">
                <SpotlightCard className="rounded-2xl">
                  <GlassPanel className="h-full transition-colors duration-300 group-hover/spot:border-gold-400/40">
                    <h3 className="font-display text-lg text-silver-100">{getSpreadName(spread, locale)}</h3>
                    <p className="mt-2 text-sm text-silver-400">{getSpreadDescription(spread, locale)}</p>
                    <p className="mt-3 text-xs text-silver-500">{formatCardCount(spread.cardCount, locale)}</p>
                  </GlassPanel>
                </SpotlightCard>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
