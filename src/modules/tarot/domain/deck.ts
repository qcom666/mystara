import { MAJOR_ARCANA } from "./major-arcana.data";
import { MINOR_ARCANA } from "./minor-arcana.data";
import type { TarotCard, TarotCardMeanings } from "./types";

/** Полная упорядоченная колода из 78 карт. Только доменные данные: перемешивания и вытягивания здесь нет. */
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
 * Доступ к двум полям с русским переводом с учётом языка (см. `TarotCard.nameRu`/`descriptionRu`).
 * Принимает обычное «en» | «ru», а не `Locale` из `lib/i18n`: модуль не зависит от слоя
 * приложения и интерфейса.
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

/** Полный объект значений на запрошенном языке; `yesNo` не зависит от языка и переносится как есть. */
export function getCardMeanings(card: TarotCard, locale: "en" | "ru"): TarotCardMeanings {
  return locale === "ru" ? { ...card.meaningsRu, yesNo: card.meanings.yesNo } : card.meanings;
}
