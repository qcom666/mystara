"use client";

import { motion, type Variants } from "framer-motion";
import { type CSSProperties, useEffect } from "react";
import { EASE_OUT } from "@/components/motion/reveal";
import { TarotCardBack } from "@/components/tarot/tarot-card-back";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale, useTranslation } from "@/lib/i18n";
import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";

interface AIInterpretationPanelProps {
  spread: TarotSpread;
  question: string;
  cards: DrawnCard[];
}

const panelVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.16 } } };
const blockVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE_OUT, staggerChildren: 0.08, delayChildren: 0.25 } },
};
const chipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 16 } },
};
const lineVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

/** Пока готовится толкование: три карты по очереди подпрыгивают и светятся, под ними мерцают строки. */
function InterpretingState({ label }: { label: string }) {
  return (
    <GlassPanel scrollReveal={false} className="space-y-4">
      <div className="flex items-end justify-center gap-3 pt-2" aria-hidden="true">
        {/* Круги на CSS (globals.css, «Украшения на CSS»): их крутит видеокарта, а не главный поток. */}
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="relative w-10 motion-safe:animate-bob"
            style={{ rotate: `${(index - 1) * 6}deg`, "--bob": "-12px", animationDuration: "1.2s", animationDelay: `${index * 0.18}s` } as CSSProperties}
          >
            <TarotCardBack className="w-full drop-shadow-lg" />
            <span
              className="absolute -inset-2 -z-10 rounded-full bg-gold-500/40 blur-lg motion-safe:animate-glow-pulse"
              style={{ "--glow-min": 0.2, "--glow-max": 0.9, "--glow-scale-min": 1, "--glow-scale-max": 1, animationDuration: "1.2s", animationDelay: `${index * 0.18}s` } as CSSProperties}
            />
          </div>
        ))}
      </div>
      <p className="text-shimmer-gold text-center text-sm font-medium">{label}</p>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </GlassPanel>
  );
}

export function AIInterpretationPanel({ spread, question, cards }: AIInterpretationPanelProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const aiResult = useReadingFlowStore((s) => s.aiResult);
  const aiResultLocale = useReadingFlowStore((s) => s.aiResultLocale);
  const aiStatus = useReadingFlowStore((s) => s.aiStatus);
  const setAIResult = useReadingFlowStore((s) => s.setAIResult);
  const setAIStatus = useReadingFlowStore((s) => s.setAIStatus);

  // Толкование написано на языке, который был активен при запросе, поэтому результат на устаревшем
  // языке считается «ещё не сформированным».
  const hasCurrentResult = Boolean(aiResult) && aiResultLocale === locale;

  useEffect(() => {
    if (hasCurrentResult) return;
    let cancelled = false;
    setAIStatus("loading");

    fetch("/api/ai/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spreadId: spread.id,
        question: question || null,
        locale,
        cards: cards.map((drawn, index) => ({
          cardId: drawn.card.id,
          positionId: drawn.position.id,
          orientation: drawn.orientation,
          order: index,
        })),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("interpretation_failed");
        const data = await response.json();
        if (!cancelled) setAIResult(data.interpretation, locale);
      })
      .catch(() => {
        if (!cancelled) setAIStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // Срабатывает, когда шаг результата монтируется для этого расклада, и ещё раз при смене языка:
    // намеренно не при каждом вводе или перерисовке.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  if (aiStatus === "error") {
    return (
      <GlassPanel scrollReveal={false}>
        <p className="text-sm text-silver-400">{t.errors.generic}</p>
      </GlassPanel>
    );
  }

  if (!aiResult || !hasCurrentResult) {
    return <InterpretingState label={t.reading.interpreting} />;
  }

  return (
    <motion.div data-reveal variants={panelVariants} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={blockVariants}>
        <GlassPanel scrollReveal={false} className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -inset-y-12 -left-1/3 w-1/4 rotate-12 bg-gradient-to-r from-transparent via-gold-300/15 to-transparent motion-safe:animate-panel-sheen" />
          </div>
          <h3 className="relative font-display text-xl text-gold-300">{t.reading.overallReadingTitle}</h3>
          <p className="relative mt-2 text-sm leading-relaxed text-silver-300">{aiResult.overall}</p>
        </GlassPanel>
      </motion.div>

      {aiResult.themes.length > 0 && (
        <motion.div variants={blockVariants}>
          <GlassPanel scrollReveal={false}>
            <h3 className="font-display text-lg text-silver-100">{t.reading.themesTitle}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {aiResult.themes.map((theme) => (
                <motion.span key={theme} variants={chipVariants} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                  {theme}
                </motion.span>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}

      <motion.div variants={blockVariants} className="grid gap-4 sm:grid-cols-2">
        <motion.div variants={blockVariants}>
          <GlassPanel scrollReveal={false} className="h-full">
            <h3 className="font-display text-lg text-silver-100">{t.reading.adviceTitle}</h3>
            <ul className="mt-2 space-y-2 text-sm text-silver-300">
              {aiResult.advice.map((line) => (
                <motion.li key={line} variants={lineVariants}>
                  • {line}
                </motion.li>
              ))}
            </ul>
          </GlassPanel>
        </motion.div>
        <motion.div variants={blockVariants}>
          <GlassPanel scrollReveal={false} className="h-full">
            <h3 className="font-display text-lg text-silver-100">{t.reading.challengesTitle}</h3>
            <ul className="mt-2 space-y-2 text-sm text-silver-300">
              {aiResult.challenges.map((line) => (
                <motion.li key={line} variants={lineVariants}>
                  • {line}
                </motion.li>
              ))}
            </ul>
          </GlassPanel>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
