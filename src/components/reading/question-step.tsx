"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useTelegramMainButton } from "@/components/telegram/use-telegram-main-button";
import { track } from "@/lib/analytics";
import { useLocale, useTranslation } from "@/lib/i18n";
import { getSpreadName } from "@/modules/tarot/domain/spreads.data";
import { useReadingFlowStore } from "@/store/reading-flow.store";
import type { TarotSpread } from "@/modules/tarot/domain/types";

interface QuestionStepProps {
  spread: TarotSpread;
}

export function QuestionStep({ spread }: QuestionStepProps) {
  const t = useTranslation();
  const { locale } = useLocale();
  const [value, setValue] = useState("");
  const setQuestion = useReadingFlowStore((s) => s.setQuestion);
  const goToShuffle = useReadingFlowStore((s) => s.goToShuffle);

  function handleContinue() {
    const trimmed = value.trim();
    setQuestion(trimmed);
    track({ name: "reading_started", spreadId: spread.id, hasQuestion: trimmed.length > 0 });
    goToShuffle();
  }

  const isTelegram = useTelegramMainButton({ text: t.reading.shuffleCta, onClick: handleContinue });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-xl px-4 py-16 sm:py-24"
    >
      <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-400">{getSpreadName(spread, locale)}</p>
      <h1 className="mt-3 text-center font-display text-3xl text-silver-50 sm:text-4xl">{t.reading.questionPrompt}</h1>
      <p className="mt-2 text-center text-sm text-silver-400">{t.reading.questionOptionalHint}</p>

      <GlassPanel className="mt-8">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t.reading.questionPlaceholder}
          rows={3}
          maxLength={500}
          aria-label={t.reading.questionPrompt}
        />
      </GlassPanel>

      {!isTelegram && (
        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleContinue}>
            {t.reading.shuffleCta}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
