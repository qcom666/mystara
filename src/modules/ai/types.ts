import type { DrawnCard, TarotSpread } from "@/modules/tarot/domain/types";

export type InterpretationLocale = "en" | "ru";

export interface AIInterpretationRequest {
  question: string | null;
  spread: TarotSpread;
  cards: DrawnCard[];
  /** Language the interpretation is written in. Defaults to English. */
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
 * Every provider's output must read as reflection, not prophecy. Enforced in
 * the Mock provider's templates and in the Anthropic provider's system
 * prompt — never relaxed just because a caller wants punchier copy.
 */
export const INTERPRETATION_DISCLAIMER =
  "This interpretation is a reflective, symbolic reading for entertainment and self-exploration — not a guaranteed prediction, and not financial, medical, or legal advice.";

export const INTERPRETATION_DISCLAIMER_RU =
  "Это толкование — рефлексивное, символическое чтение для развлечения и самопознания, а не гарантированное предсказание и не финансовый, медицинский или юридический совет.";

export function getInterpretationDisclaimer(locale: InterpretationLocale = "en"): string {
  return locale === "ru" ? INTERPRETATION_DISCLAIMER_RU : INTERPRETATION_DISCLAIMER;
}
