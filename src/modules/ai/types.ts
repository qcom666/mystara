import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";

export type InterpretationLocale = "en" | "ru";

export interface AIInterpretationRequest {
  question: string | null;
  spread: TarotSpread;
  cards: DrawnCard[];
  /** Язык, на котором пишется толкование. По умолчанию английский. */
  locale?: InterpretationLocale;
}

export interface CardInterpretation {
  positionId: string;
  cardId: string;
  interpretation: string;
}

export interface AIInterpretationResult {
  provider: string;
  summary: string;
  overall: string;
  cardInterpretations: CardInterpretation[];
  themes: string[];
  advice: string[];
  challenges: string[];
  generatedAt: string;
}

export interface AIInterpretationProvider {
  readonly id: string;
  generate(request: AIInterpretationRequest): Promise<AIInterpretationResult>;
}

/**
 * Вывод любого провайдера должен читаться как размышление, а не пророчество. Это обеспечивают шаблоны
 * Mock-провайдера и системная инструкция провайдера Anthropic; не ослабляется только потому,
 * что кому-то нужен более хлёсткий текст.
 */
export const INTERPRETATION_DISCLAIMER =
  "This interpretation is a reflective, symbolic reading for entertainment and self-exploration — not a guaranteed prediction, and not financial, medical, or legal advice.";

export const INTERPRETATION_DISCLAIMER_RU =
  "Это толкование — рефлексивное, символическое чтение для развлечения и самопознания, а не гарантированное предсказание и не финансовый, медицинский или юридический совет.";

export function getInterpretationDisclaimer(locale: InterpretationLocale = "en"): string {
  return locale === "ru" ? INTERPRETATION_DISCLAIMER_RU : INTERPRETATION_DISCLAIMER;
}
