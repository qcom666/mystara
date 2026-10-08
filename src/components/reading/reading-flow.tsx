"use client";

import { useEffect } from "react";
import type { TarotSpread } from "@/modules/tarot/domain/types";
import { useReadingFlowStore } from "@/store/reading-flow.store";
import { QuestionStep } from "./question-step";
import { ResultStep } from "./result-step";
import { RevealStep } from "./reveal-step";
import { ShuffleStep } from "./shuffle-step";

interface ReadingFlowProps {
  spread: TarotSpread;
  isAuthenticated: boolean;
}

/**
 * Управляет цепочкой «расклад → вопрос → перемешивание → открытие карт → результат»
 * (состояние хранится в reading-flow.store.ts).
 */
export function ReadingFlow({ spread, isAuthenticated }: ReadingFlowProps) {
  const step = useReadingFlowStore((s) => s.step);
  const spreadId = useReadingFlowStore((s) => s.spreadId);
  const reset = useReadingFlowStore((s) => s.reset);
  const selectSpread = useReadingFlowStore((s) => s.selectSpread);

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

  switch (step) {
    case "question":
      return <QuestionStep spread={spread} />;
    case "shuffle":
      return <ShuffleStep spread={spread} />;
    case "reveal":
      return <RevealStep spread={spread} />;
    case "result":
      return <ResultStep spread={spread} isAuthenticated={isAuthenticated} />;
    default:
      return <QuestionStep spread={spread} />;
  }
}
