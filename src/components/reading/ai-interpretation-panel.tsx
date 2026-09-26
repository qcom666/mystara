"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
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

export function AIInterpretationPanel({ spread, question, cards }: AIInterpretationPanelProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const aiResult = useReadingFlowStore((s) => s.aiResult);
  const aiResultLocale = useReadingFlowStore((s) => s.aiResultLocale);
  const aiStatus = useReadingFlowStore((s) => s.aiStatus);
  const setAIResult = useReadingFlowStore((s) => s.setAIResult);
  const setAIStatus = useReadingFlowStore((s) => s.setAIStatus);

  // The interpretation is written in the language that was active when it
  // was requested, so a stale-language result counts as "not generated yet".
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
    // Runs when the result step mounts for this reading and again if the
    // user switches language — deliberately not on every keystroke/re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  if (aiStatus === "error") {
    return (
      <GlassPanel>
        <p className="text-sm text-silver-400">{t.errors.generic}</p>
      </GlassPanel>
    );
  }

  if (!aiResult || !hasCurrentResult) {
    return (
      <GlassPanel className="space-y-3">
        <p className="text-sm text-gold-300">{t.reading.interpreting}</p>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </GlassPanel>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <GlassPanel>
        <h3 className="font-display text-xl text-gold-300">{t.reading.overallReadingTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-silver-300">{aiResult.overall}</p>
      </GlassPanel>

      {aiResult.themes.length > 0 && (
        <GlassPanel>
          <h3 className="font-display text-lg text-silver-100">{t.reading.themesTitle}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {aiResult.themes.map((theme) => (
              <span key={theme} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
                {theme}
              </span>
            ))}
          </div>
        </GlassPanel>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassPanel>
          <h3 className="font-display text-lg text-silver-100">{t.reading.adviceTitle}</h3>
          <ul className="mt-2 space-y-2 text-sm text-silver-300">
            {aiResult.advice.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </GlassPanel>
        <GlassPanel>
          <h3 className="font-display text-lg text-silver-100">{t.reading.challengesTitle}</h3>
          <ul className="mt-2 space-y-2 text-sm text-silver-300">
            {aiResult.challenges.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </GlassPanel>
      </div>
    </motion.div>
  );
}
