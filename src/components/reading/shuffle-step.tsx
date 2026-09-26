"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { DeckShuffle } from "@/components/tarot/deck-shuffle";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTelegramMainButton } from "@/components/telegram/use-telegram-main-button";
import { track } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { drawForSpread } from "@/modules/tarot/services/draw-engine";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";

interface ShuffleStepProps {
  spread: TarotSpread;
}

const SHUFFLE_DURATION_MS = 1400;

export function ShuffleStep({ spread }: ShuffleStepProps) {
  const t = useTranslation();
  const [shuffling, setShuffling] = useState(false);
  const completeDraw = useReadingFlowStore((s) => s.completeDraw);
  const hasStarted = useRef(false);
  const { webApp } = useTelegram();

  function handleShuffle() {
    if (hasStarted.current) return;
    hasStarted.current = true;
    setShuffling(true);
    webApp?.HapticFeedback.impactOccurred("medium");

    window.setTimeout(() => {
      const result = drawForSpread(spread);
      for (const drawn of result.cards) {
        track({ name: "card_drawn", cardId: drawn.card.id, positionId: drawn.position.id, orientation: drawn.orientation });
      }
      track({ name: "reading_completed", spreadId: spread.id });
      webApp?.HapticFeedback.notificationOccurred("success");
      completeDraw(result.seed, result.cards);
    }, SHUFFLE_DURATION_MS);
  }

  const isTelegram = useTelegramMainButton({ text: t.reading.shuffleCta, onClick: handleShuffle, visible: !shuffling });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <DeckShuffle shuffling={shuffling} />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-sm text-silver-400">
        {shuffling ? t.reading.shuffling : t.reading.focusHint}
      </motion.p>
      {!shuffling && !isTelegram && (
        <Button size="lg" className="mt-6" onClick={handleShuffle}>
          {t.reading.shuffleCta}
        </Button>
      )}
    </div>
  );
}
