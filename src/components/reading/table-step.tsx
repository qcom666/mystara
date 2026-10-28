"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { EASE_OUT } from "@/components/motion/reveal";
import { CardDetailContent } from "@/components/tarot/card-detail-content";
import { FlippableCard } from "@/components/tarot/flippable-card";
import { DEAL_FLIGHT_S, DEAL_STAGGER_S, DEAL_START_S, SpreadLayout } from "@/components/tarot/spread-layout";
import { TarotCardBack } from "@/components/tarot/tarot-card-back";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PrimaryActionBar } from "@/components/telegram/primary-action-bar";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getCardName } from "@/modules/tarot/domain/deck";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";
import { ResultDetails } from "./result-details";

interface TableStepProps {
  spread: TarotSpread;
  isAuthenticated: boolean;
}

/** Пауза между картами при «Открыть все»: карты переворачиваются по очереди, а не разом. */
const REVEAL_ALL_STAGGER_MS = 220;

/** Золотая волна по картам после «Продолжить»: каждая вспыхивает и чуть приподнимается, по очереди. */
function ResultGlow({ index, children }: { index: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="relative"
      animate={reduceMotion ? undefined : { y: [0, -10, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 0.8, delay: index * 0.09, ease: EASE_OUT }}
    >
      {children}
      {!reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[6.7%/4%] shadow-[0_0_40px_6px_rgba(243,218,143,0.55)] ring-1 ring-gold-200/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1, delay: index * 0.09, times: [0, 0.35, 1] }}
        />
      )}
    </motion.div>
  );
}

/**
 * Стол расклада: сверху колода, из которой карты по очереди раздаются на свои места; их открывают касанием
 * или все по очереди кнопкой. После «Продолжить» карты остаются лежать (по ним проходит золотая волна),
 * а ниже проявляется толкование. Раньше это были два экрана, и при переходе карты раздавались заново.
 */
export function TableStep({ spread, isAuthenticated }: TableStepProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const step = useReadingFlowStore((s) => s.step);
  const drawnCards = useReadingFlowStore((s) => s.drawnCards);
  const revealed = useReadingFlowStore((s) => s.revealed);
  const revealCard = useReadingFlowStore((s) => s.revealCard);
  const goToResult = useReadingFlowStore((s) => s.goToResult);
  const question = useReadingFlowStore((s) => s.question);
  const { webApp } = useTelegram();
  const reduceMotion = useReducedMotion();

  const deckRef = useRef<HTMLDivElement>(null);
  const revealTimers = useRef<number[]>([]);
  const [dealt, setDealt] = useState(false);
  const [revealingAll, setRevealingAll] = useState(false);
  const [activeCard, setActiveCard] = useState<DrawnCard | null>(null);
  const isResult = step === "result";

  // Колода растворяется, когда последняя карта легла на место.
  useEffect(() => {
    const dealMs = reduceMotion ? 0 : (DEAL_START_S + drawnCards.length * DEAL_STAGGER_S + DEAL_FLIGHT_S * 0.7) * 1000;
    const timer = window.setTimeout(() => setDealt(true), dealMs);
    return () => window.clearTimeout(timer);
  }, [drawnCards.length, reduceMotion]);

  useEffect(() => {
    const timers = revealTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const allRevealed = useMemo(() => drawnCards.length > 0 && drawnCards.every((c) => revealed[c.position.id]), [drawnCards, revealed]);

  function handleRevealCard(positionId: string) {
    webApp?.HapticFeedback.impactOccurred("light");
    revealCard(positionId);
  }

  function handleRevealAll() {
    setRevealingAll(true);
    const pending = drawnCards.filter((drawn) => !revealed[drawn.position.id]);
    pending.forEach((drawn, index) => {
      revealTimers.current.push(window.setTimeout(() => handleRevealCard(drawn.position.id), reduceMotion ? 0 : index * REVEAL_ALL_STAGGER_MS));
    });
  }

  function handleContinue() {
    webApp?.HapticFeedback.notificationOccurred("success");
    goToResult();
  }

  return (
    <div className="mx-auto max-w-5xl overflow-x-clip px-4 py-12 sm:py-16">
      <motion.div className="text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
        {question && <p className="mx-auto mt-3 max-w-md text-sm italic text-silver-400">{`“${question}”`}</p>}
      </motion.div>

      <div className="relative mt-20">
        {/* Колода над столом: карты вылетают из-под неё. Меряем неподвижную обёртку, а не анимированную колоду. */}
        <div ref={deckRef} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 z-20 h-24 w-[3.6rem] -translate-x-1/2 -translate-y-[85%]">
          <AnimatePresence>
            {!dealt && (
              <motion.div
                key="deck"
                className="relative h-full w-full"
                initial={{ opacity: 0, y: -24, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, filter: "blur(6px)", transition: { duration: 0.45 } }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {[0, 1, 2].map((layer) => (
                  <div key={layer} className="absolute inset-0" style={{ transform: `translate(${layer * 1.5}px, ${-layer * 1.5}px)` }}>
                    <TarotCardBack className="h-full w-full drop-shadow-lg" />
                  </div>
                ))}
                <span className="absolute -inset-4 -z-10 rounded-full bg-gold-500/30 blur-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SpreadLayout
          spread={spread}
          cards={drawnCards}
          dealFrom={deckRef}
          renderCard={(drawn) =>
            isResult ? (
              <button
                type="button"
                onClick={() => setActiveCard(drawn)}
                aria-label={`${t.reading.viewDetailsFor} ${getCardName(drawn.card, locale)}${drawn.orientation === "reversed" ? ` (${t.reading.reversed.toLowerCase()})` : ""}`}
                className="focus-ring block w-full rounded-xl"
              >
                <ResultGlow index={drawnCards.indexOf(drawn)}>
                  <FlippableCard card={drawn.card} orientation={drawn.orientation} revealed interactive={false} />
                </ResultGlow>
              </button>
            ) : (
              <FlippableCard
                card={drawn.card}
                orientation={drawn.orientation}
                revealed={Boolean(revealed[drawn.position.id])}
                onReveal={() => handleRevealCard(drawn.position.id)}
              />
            )
          }
        />
      </div>

      {!isResult && (
        <div className="mt-10 flex min-h-14 flex-col items-center justify-center gap-3">
          <AnimatePresence mode="wait">
            {dealt && !allRevealed && !revealingAll && (
              <motion.p
                key="hint"
                className="text-shimmer-gold text-sm font-medium"
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                {t.reading.tapCardsHint}
              </motion.p>
            )}
          </AnimatePresence>
          <PrimaryActionBar className="flex flex-wrap justify-center gap-3">
            <AnimatePresence mode="wait" initial={false}>
              {!allRevealed ? (
                <motion.div key="reveal-all" exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }} transition={{ duration: 0.25 }}>
                  <Button variant="secondary" onClick={handleRevealAll} disabled={!dealt || revealingAll} className="w-full">
                    {t.reading.revealAllCta}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="continue"
                  className="relative"
                  initial={{ opacity: 0, scale: 0.6, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.5 }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full border border-gold-300/70 opacity-0 motion-safe:animate-ring-pulse"
                    style={{ "--ring-start": 1, "--ring-end": 1.35, "--ring-max": 0.7, animationDuration: "1.8s", animationDelay: "1s" } as CSSProperties}
                  />
                  <Button size="lg" onClick={handleContinue} className="relative w-full overflow-hidden shadow-[0_0_40px_-8px_rgba(212,175,55,0.75)]">
                    <span aria-hidden="true" className="pointer-events-none absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent motion-safe:animate-panel-sheen" />
                    <Sparkles className="relative h-4 w-4" />
                    <span className="relative">{t.reading.toInterpretationCta}</span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </PrimaryActionBar>
        </div>
      )}

      {isResult && <ResultDetails spread={spread} isAuthenticated={isAuthenticated} />}

      <Dialog open={Boolean(activeCard)} onOpenChange={(open) => !open && setActiveCard(null)}>
        <DialogContent>
          {activeCard && (
            <>
              <DialogTitle className="sr-only">{getCardName(activeCard.card, locale)}</DialogTitle>
              <CardDetailContent card={activeCard.card} orientation={activeCard.orientation} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
