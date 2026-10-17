import { createSeededRandom } from "@/lib/rng";
import { FULL_DECK } from "../domain/deck";
import type { Orientation, TarotCard } from "../domain/types";
import { REVERSED_PROBABILITY } from "./draw-engine";

/**
 * «Карта дня»: одна карта на человека в сутки. Выбор детерминирован по паре (кто, какой день), поэтому
 * повторный запрос в тот же день показывает ту же карту, а у разных людей карты разные.
 */
export interface DailyCard {
  card: TarotCard;
  orientation: Orientation;
}

export function dailyCard(subject: string, day: string): DailyCard {
  const random = createSeededRandom(`daily:${subject}:${day}`);
  const card = FULL_DECK[Math.floor(random() * FULL_DECK.length)];
  const orientation: Orientation = random() < REVERSED_PROBABILITY ? "reversed" : "upright";
  return { card, orientation };
}

/** Календарный день «ГГГГ-ММ-ДД» по Москве: аудитория в основном в России, и день меняется в полночь по МСК. */
export function moscowDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
