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

/** Чья это карта: общая для гостей, личная по аккаунту или личная по Telegram (совпадает с картой от бота). */
export type DailyCardKind = "guest" | "account" | "telegram";

/** Ответ GET /api/tarot/daily-card. */
export interface DailyCardPayload {
  day: string;
  cardId: string;
  orientation: Orientation;
  kind: DailyCardKind;
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

/** Общая карта дня для гостей: без входа личную карту выбрать не по чему, а идентификаторов посетителей мы не храним. */
export const GUEST_DAILY_SUBJECT = "guest";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Москва живёт по UTC+3 круглый год (перехода на летнее время нет с 2014 года). */
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Сколько миллисекунд осталось до полуночи по Москве, то есть до следующей карты дня. */
export function msUntilNextMoscowDay(now: number = Date.now()): number {
  return DAY_MS - ((now + MOSCOW_OFFSET_MS) % DAY_MS);
}
