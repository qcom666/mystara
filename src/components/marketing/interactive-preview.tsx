"use client";

import Link from "next/link";
import { useState } from "react";
import { FlippableCard } from "@/components/tarot/flippable-card";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardMeanings, getCardName } from "@/modules/tarot/domain/deck";
import { drawForSpread } from "@/modules/tarot/services/draw-engine";
import { requireSpreadById } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard } from "@/modules/tarot/domain/types";

const ONE_CARD_SPREAD = requireSpreadById("one-card");

export function InteractivePreview() {
  const t = useTranslation();
  const { locale } = useLocale();
  const [drawn, setDrawn] = useState<DrawnCard | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleDraw() {
    const result = drawForSpread(ONE_CARD_SPREAD);
    setDrawn(result.cards[0]);
    setRevealed(false);
  }

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{t.marketing.preview.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl text-silver-50">{t.marketing.preview.title}</h2>
        <p className="mt-2 text-silver-400">{t.marketing.preview.subtitle}</p>

        <GlassPanel className="mt-8">
          {!drawn ? (
            <div className="py-10">
              <Button size="lg" onClick={handleDraw}>
                {t.marketing.preview.drawCta}
              </Button>
            </div>
          ) : (
            <div className="mx-auto max-w-[180px]">
              <FlippableCard card={drawn.card} orientation={drawn.orientation} revealed={revealed} onReveal={() => setRevealed(true)} />
            </div>
          )}
          {drawn && revealed && (
            <div className="mt-5">
              <p className="font-display text-xl text-gold-300">
                {getCardName(drawn.card, locale)}
                {drawn.orientation === "reversed" ? ` (${t.reading.reversed.toLowerCase()})` : ""}
              </p>
              <p className="mt-2 text-sm text-silver-400">
                {drawn.orientation === "upright" ? getCardMeanings(drawn.card, locale).upright : getCardMeanings(drawn.card, locale).reversed}
              </p>
              <Button asChild className="mt-5">
                <Link href="/reading">{t.marketing.preview.fullReadingCta}</Link>
              </Button>
            </div>
          )}
        </GlassPanel>
      </div>
    </section>
  );
}
