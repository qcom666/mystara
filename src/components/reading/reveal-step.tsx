"use client";

import { useMemo } from "react";
import { FlippableCard } from "@/components/tarot/flippable-card";
import { SpreadLayout } from "@/components/tarot/spread-layout";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTelegramMainButton } from "@/components/telegram/use-telegram-main-button";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";

interface RevealStepProps {
  spread: TarotSpread;
}

export function RevealStep({ spread }: RevealStepProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const drawnCards = useReadingFlowStore((s) => s.drawnCards);
  const revealed = useReadingFlowStore((s) => s.revealed);
  const revealCard = useReadingFlowStore((s) => s.revealCard);
  const revealAll = useReadingFlowStore((s) => s.revealAll);
  const goToResult = useReadingFlowStore((s) => s.goToResult);
  const question = useReadingFlowStore((s) => s.question);
  const { webApp } = useTelegram();

  const allRevealed = useMemo(
    () => drawnCards.length > 0 && drawnCards.every((c) => revealed[c.position.id]),
    [drawnCards, revealed],
  );

  function handleRevealCard(positionId: string) {
    webApp?.HapticFeedback.impactOccurred("light");
    revealCard(positionId);
  }

  // Only one MainButton slot exists — it mirrors whichever action is
  // currently primary: "reveal all" until every card is flipped, then
  // "continue" once they are.
  const isTelegram = useTelegramMainButton({
    text: allRevealed ? t.common.continue : t.reading.revealAllCta,
    onClick: allRevealed ? goToResult : revealAll,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
        {question && <p className="mx-auto mt-3 max-w-md text-sm italic text-silver-400">{`“${question}”`}</p>}
      </div>

      <div className="mt-10">
        <SpreadLayout
          spread={spread}
          cards={drawnCards}
          renderCard={(drawn) => (
            <FlippableCard
              card={drawn.card}
              orientation={drawn.orientation}
              revealed={Boolean(revealed[drawn.position.id])}
              onReveal={() => handleRevealCard(drawn.position.id)}
            />
          )}
        />
      </div>

      {!isTelegram && (
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {!allRevealed && (
            <Button variant="secondary" onClick={revealAll}>
              {t.reading.revealAllCta}
            </Button>
          )}
          {allRevealed && (
            <Button size="lg" onClick={goToResult}>
              {t.common.continue}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
