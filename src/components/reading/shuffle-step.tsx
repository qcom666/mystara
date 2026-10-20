"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { EASE_OUT } from "@/components/motion/reveal";
import { SHUFFLE_MS } from "@/components/tarot/deck-motion";
import { DeckShuffle } from "@/components/tarot/deck-shuffle";
import { Button } from "@/components/ui/button";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { track } from "@/lib/analytics";
import { useLocale, useTranslation } from "@/lib/i18n";
import { drawForSpread } from "@/modules/tarot/services/draw-engine";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";

interface ShuffleStepProps {
  spread: TarotSpread;
}

/** Перетасовка длится один полный круг веера: карты разлетаются и успевают собраться перед раздачей. */
const SHUFFLE_DURATION_MS = SHUFFLE_MS;

export function ShuffleStep({ spread }: ShuffleStepProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const [shuffling, setShuffling] = useState(false);
  const completeDraw = useReadingFlowStore((s) => s.completeDraw);
  const question = useReadingFlowStore((s) => s.question);
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

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center overflow-x-clip px-4 py-10 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
      {question && <p className="mx-auto mt-3 max-w-sm text-sm italic text-silver-400">{`“${question}”`}</p>}

      <DeckShuffle shuffling={shuffling} className="mt-2" />

      <div className="flex min-h-6 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={shuffling ? "shuffling" : "focus"}
            className={shuffling ? "text-sm text-gold-200" : "text-sm text-silver-400"}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            {shuffling ? t.reading.shuffling : t.reading.focusHint}
          </motion.p>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {!shuffling && (
          <motion.div
            key="shuffle-cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
          >
            <PrimaryActionBar className="mt-6">
              <Button size="lg" onClick={handleShuffle} className="relative overflow-hidden shadow-[0_0_40px_-8px_rgba(212,175,55,0.7)]">
                <span aria-hidden="true" className="pointer-events-none absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-panel-sheen" />
                <span className="relative">{t.reading.shuffleCta}</span>
              </Button>
            </PrimaryActionBar>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
