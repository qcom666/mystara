import { requireCardById } from "../domain/deck";
import type { DrawnCard, DrawResult, ReadingCardRecord, TarotSpread } from "../domain/types";

/** Превращает свежевытянутые карты в простые записи для сохранения (строки `ReadingCard`). */
export function toReadingCardRecords(drawResult: DrawResult): ReadingCardRecord[] {
  return drawResult.cards.map((drawn, index) => ({
    cardId: drawn.card.id,
    positionId: drawn.position.id,
    orientation: drawn.orientation,
    order: index,
  }));
}

/**
 * Восстанавливает точный набор вытянутых карт сохранённого расклада по его записям: это использует
 * `/readings/[id]`. Генератор случайных чисел намеренно НЕ воспроизводится: исторический расклад должен
 * отображаться одинаково, даже если алгоритм выбора позже изменится.
 */
export function reconstructDrawnCards(spread: TarotSpread, records: readonly ReadingCardRecord[]): DrawnCard[] {
  const positionById = new Map(spread.positions.map((position) => [position.id, position]));

  return [...records]
    .sort((a, b) => a.order - b.order)
    .map((record) => {
      const position = positionById.get(record.positionId);
      if (!position) {
        throw new Error(`Reading references unknown position "${record.positionId}" for spread "${spread.id}".`);
      }
      return {
        card: requireCardById(record.cardId),
        orientation: record.orientation,
        position,
      };
    });
}
