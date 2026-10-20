"use client";

import { track } from "@/lib/analytics";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore, type ReadingStep } from "@/store/reading-flow.store";
import { QuestionStep } from "./question-step";
import { ShuffleStep } from "./shuffle-step";
import { TableStep } from "./table-step";

interface ReadingFlowProps {
  spread: TarotSpread;
  isAuthenticated: boolean;
}

/** Открытие карт и результат — один экран (стол), поэтому при «Продолжить» карты остаются на месте. */
const stageOf = (step: ReadingStep) => (step === "reveal" || step === "result" ? "table" : step === "shuffle" ? "shuffle" : "question");

/**
 * Управляет цепочкой «расклад → вопрос → перемешивание → открытие карт → результат»
 * (состояние хранится в reading-flow.store.ts). Экраны сменяют друг друга плавно: старый уходит вверх с
 * размытием, новый поднимается снизу.
 */
export function ReadingFlow({ spread, isAuthenticated }: ReadingFlowProps) {
  const step = useReadingFlowStore((s) => s.step);
  const spreadId = useReadingFlowStore((s) => s.spreadId);
  const reset = useReadingFlowStore((s) => s.reset);
  const selectSpread = useReadingFlowStore((s) => s.selectSpread);

  // Отдельный эффект с защитой: в режиме разработки React запускает эффекты дважды, а событие нужно одно.
  const trackedSpread = useRef<string | null>(null);
  useEffect(() => {
    if (trackedSpread.current === spread.id) return;
    trackedSpread.current = spread.id;
    track({ name: "spread_selected", spreadId: spread.id });
  }, [spread.id]);

  useEffect(() => {
    if (spreadId !== spread.id) {
      reset();
      selectSpread(spread.id);
    }
    // Синхронизируемся при смене расклада в маршруте (например, кнопка «назад» на другой расклад);
    // внутренности стора здесь намеренно не отслеживаем.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spread.id]);

  if (spreadId !== spread.id) {
    return null;
  }

  const stage = stageOf(step);

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      // Новый экран начинается сверху: стол раздаёт карты из колоды над ними.
      onExitComplete={() => {
        if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      }}
    >
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        // Размытие снимаем совсем: фильтр на контейнере всей страницы держал бы её в отдельном слое.
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {stage === "question" && <QuestionStep spread={spread} />}
        {stage === "shuffle" && <ShuffleStep spread={spread} />}
        {stage === "table" && <TableStep spread={spread} isAuthenticated={isAuthenticated} />}
      </motion.div>
    </AnimatePresence>
  );
}
