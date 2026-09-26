import { MAJOR_ARCANA } from "./major-arcana.data";
import { MINOR_ARCANA } from "./minor-arcana.data";
import type { TarotCard, TarotCardMeanings } from "./types";

/** The full, ordered 78-card deck. Domain data only — no shuffling/drawing here. */
export const FULL_DECK: readonly TarotCard[] = Object.freeze([...MAJOR_ARCANA, ...MINOR_ARCANA]);

const CARD_BY_ID: ReadonlyMap<string, TarotCard> = new Map(FULL_DECK.map((card) => [card.id, card]));

export function getAllCards(): readonly TarotCard[] {
  return FULL_DECK;
}

export function getCardById(id: string): TarotCard | undefined {
  return CARD_BY_ID.get(id);
}

export function requireCardById(id: string): TarotCard {
  const card = getCardById(id);
  if (!card) {
    throw new Error(`Unknown tarot card id: "${id}"`);
  }
  return card;
}

export function getMajorArcana(): readonly TarotCard[] {
  return MAJOR_ARCANA;
}

export function getCardsBySuit(suit: TarotCard["suit"]): readonly TarotCard[] {
  return FULL_DECK.filter((card) => card.suit === suit);
}

/**
 * Locale-aware accessors for the two fields that ship a Russian translation
 * (see `TarotCard.nameRu`/`descriptionRu` and PROJECT_ARCHITECTURE.md §14).
 * Takes a plain `"en" | "ru"` rather than importing `Locale` from `lib/i18n`
 * — this module stays zero-dependency on the app/UI layer (see §3).
 */
export function getCardName(card: TarotCard, locale: "en" | "ru"): string {
  return locale === "ru" ? card.nameRu : card.name;
}

export function getCardDescription(card: TarotCard, locale: "en" | "ru"): string {
  return locale === "ru" ? card.descriptionRu : card.description;
}

export function getCardKeywords(card: TarotCard, locale: "en" | "ru"): string[] {
  return locale === "ru" ? card.keywordsRu : card.keywords;
}

/** The full meanings object in the requested language — `yesNo` is language-independent and carried over as-is. */
export function getCardMeanings(card: TarotCard, locale: "en" | "ru"): TarotCardMeanings {
  return locale === "ru" ? { ...card.meaningsRu, yesNo: card.meanings.yesNo } : card.meanings;
}
