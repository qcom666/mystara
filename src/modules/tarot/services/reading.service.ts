import { requireCardById } from "../domain/deck";
import type { DrawnCard, DrawResult, ReadingCardRecord, TarotSpread } from "../domain/types";

/** Flattens a fresh draw into the plain records that get persisted (`ReadingCard` rows). */
export function toReadingCardRecords(drawResult: DrawResult): ReadingCardRecord[] {
  return drawResult.cards.map((drawn, index) => ({
    cardId: drawn.card.id,
    positionId: drawn.position.id,
    orientation: drawn.orientation,
    order: index,
  }));
}

/**
 * Rebuilds the exact set of drawn cards for a saved reading from its stored
 * records — this is what `/readings/[id]` uses. Deliberately does NOT replay
 * the RNG: a historical reading must render identically even if the draw
 * engine's algorithm changes later (see PROJECT_ARCHITECTURE.md §6).
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
