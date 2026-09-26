import { createSeededRandom, generateSeed, shuffle } from "@/lib/rng";
import { getAllCards } from "../domain/deck";
import type { DrawnCard, DrawResult, Orientation, TarotCard, TarotSpread } from "../domain/types";

/** Traditional convention; named so it's easy to make configurable per-spread later. */
export const REVERSED_PROBABILITY = 0.3;

function rollOrientation(random: () => number): Orientation {
  return random() < REVERSED_PROBABILITY ? "reversed" : "upright";
}

/**
 * Draws cards for a spread. Deterministic given a seed: the same
 * `spread` + `seed` always produces the same shuffle and the same
 * orientations. No duplicates are possible — cards are taken without
 * replacement from a single shuffled deck, not picked independently.
 *
 * IMPORTANT: this is for *generating* a new reading (or replaying one for a
 * share preview). A saved reading should be rendered from its persisted
 * `ReadingCard` rows, not by calling this again — see PROJECT_ARCHITECTURE.md §6.
 */
export function drawForSpread(spread: TarotSpread, options?: { seed?: string; deck?: readonly TarotCard[] }): DrawResult {
  const seed = options?.seed ?? generateSeed();
  const deck = options?.deck ?? getAllCards();

  if (spread.cardCount > deck.length) {
    throw new Error(`Spread "${spread.id}" requires ${spread.cardCount} cards but the deck only has ${deck.length}.`);
  }

  const random = createSeededRandom(seed);
  const shuffled = shuffle(deck, random);
  const drawn = shuffled.slice(0, spread.cardCount);

  const positions = [...spread.positions].sort((a, b) => a.order - b.order);

  const cards: DrawnCard[] = drawn.map((card, index) => ({
    card,
    orientation: rollOrientation(random),
    position: positions[index],
  }));

  return { seed, cards };
}
