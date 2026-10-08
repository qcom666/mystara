import { createSeededRandom, generateSeed, shuffle } from "@/lib/rng";
import { getAllCards } from "../domain/deck";
import type { DrawnCard, DrawResult, Orientation, TarotCard, TarotSpread } from "../domain/types";

/**
 * Традиционное соглашение; вынесено в именованную константу, чтобы позже было легко сделать
 * настраиваемым для каждого расклада.
 */
export const REVERSED_PROBABILITY = 0.3;

function rollOrientation(random: () => number): Orientation {
  return random() < REVERSED_PROBABILITY ? "reversed" : "upright";
}

/**
 * Вытягивает карты для расклада. Детерминирована при заданном зерне: одни и те же `spread` и `seed`
 * всегда дают одно и то же перемешивание и одни и те же положения. Дубликаты невозможны: карты берутся
 * без возвращения из одной перетасованной колоды, а не выбираются независимо.
 *
 * ВАЖНО: функция для *создания* нового расклада (или повтора для превью). Сохранённый расклад нужно
 * отображать по его сохранённым строкам `ReadingCard`, а не вызывая её снова.
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
