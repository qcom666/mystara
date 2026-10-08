import { create } from "zustand";
import type { AIInterpretationResult } from "@/modules/ai/types";
import type { DrawnCard } from "@/modules/tarot/domain/types";

export type ReadingStep = "spread" | "question" | "shuffle" | "reveal" | "result";

type RevealedMap = Record<string, boolean>;
type AIStatus = "idle" | "loading" | "error";

interface ReadingFlowState {
  step: ReadingStep;
  spreadId: string | null;
  question: string;
  seed: string | null;
  drawnCards: DrawnCard[];
  revealed: RevealedMap;
  aiResult: AIInterpretationResult | null;
  /** Язык, на котором написан `aiResult`: позволяет панели сгенерировать толкование заново при смене языка. */
  aiResultLocale: "en" | "ru" | null;
  aiStatus: AIStatus;
  savedReadingId: string | null;

  selectSpread: (spreadId: string) => void;
  setQuestion: (question: string) => void;
  goToShuffle: () => void;
  completeDraw: (seed: string, cards: DrawnCard[]) => void;
  revealCard: (positionId: string) => void;
  revealAll: () => void;
  goToResult: () => void;
  setAIResult: (result: AIInterpretationResult, locale: "en" | "ru") => void;
  setAIStatus: (status: AIStatus) => void;
  setSavedReadingId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  step: "spread" as ReadingStep,
  spreadId: null as string | null,
  question: "",
  seed: null as string | null,
  drawnCards: [] as DrawnCard[],
  revealed: {} as RevealedMap,
  aiResult: null as AIInterpretationResult | null,
  aiResultLocale: null as "en" | "ru" | null,
  aiStatus: "idle" as AIStatus,
  savedReadingId: null as string | null,
};

/**
 * Единственное по-настоящему общее для компонентов временное клиентское состояние приложения:
 * расклад в процессе. Всё остальное использует данные сервера или локальное состояние компонента.
 */
export const useReadingFlowStore = create<ReadingFlowState>((set) => ({
  ...initialState,

  selectSpread: (spreadId) => set({ spreadId, step: "question" }),
  setQuestion: (question) => set({ question }),
  goToShuffle: () => set({ step: "shuffle" }),
  completeDraw: (seed, cards) =>
    set({
      seed,
      drawnCards: cards,
      revealed: Object.fromEntries(cards.map((c) => [c.position.id, false])),
      step: "reveal",
    }),
  revealCard: (positionId) => set((state) => ({ revealed: { ...state.revealed, [positionId]: true } })),
  revealAll: () =>
    set((state) => ({
      revealed: Object.fromEntries(state.drawnCards.map((c) => [c.position.id, true])),
    })),
  goToResult: () => set({ step: "result" }),
  setAIResult: (result, locale) => set({ aiResult: result, aiResultLocale: locale, aiStatus: "idle" }),
  setAIStatus: (status) => set({ aiStatus: status }),
  setSavedReadingId: (id) => set({ savedReadingId: id }),
  reset: () => set(initialState),
}));
