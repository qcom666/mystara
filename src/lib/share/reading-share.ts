import { getCardById, getCardName } from "@/modules/tarot/domain/deck";
import { getPositionLabel, getSpreadById, getSpreadName } from "@/modules/tarot/domain/spreads.data";
import type { DrawnCard, TarotCard } from "@/modules/tarot/domain/types";

/**
 * Картинка расклада, которой можно поделиться (сторис, пост, мессенджер). В адрес картинки попадают только
 * расклад и вытянутые карты, без вопроса и без каких-либо данных о человеке: такую картинку не страшно
 * выложить публично, а по адресу нельзя узнать, кто и о чём спрашивал.
 */

export type ShareFormat = "post" | "story";
export type ShareLocale = "ru" | "en";

export const SHARE_SIZES: Record<ShareFormat, { width: number; height: number }> = {
  post: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

/** «the-fool.u,the-tower.r»: id карты и положение (u - прямое, r - перевёрнутое) в порядке позиций расклада. */
export function encodeShareCards(cards: DrawnCard[]): string {
  return cards.map((drawn) => `${drawn.card.id}.${drawn.orientation === "reversed" ? "r" : "u"}`).join(",");
}

export function buildShareImagePath(spreadId: string, cards: DrawnCard[], locale: ShareLocale, format: ShareFormat = "story"): string {
  const params = new URLSearchParams({ spread: spreadId, cards: encodeShareCards(cards), locale, format });
  return `/api/share/reading?${params.toString()}`;
}

export interface ShareCardView {
  name: string;
  position: string;
  reversed: boolean;
  /** Римская цифра старшего аркана или достоинство младшего. */
  mark: string;
  suit: TarotCard["suit"];
}

export interface ShareView {
  spreadName: string;
  cards: ShareCardView[];
  locale: ShareLocale;
  format: ShareFormat;
}

const ROMAN: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

export function toRoman(value: number): string {
  if (value === 0) return "0";
  let rest = value;
  let result = "";
  for (const [amount, letters] of ROMAN) {
    while (rest >= amount) {
      result += letters;
      rest -= amount;
    }
  }
  return result;
}

// Туз и фигуры подписываются словом, как в колоде на сайте (ПАЖ, РЫЦАРЬ, КОРОЛЕВА, КОРОЛЬ).
const COURT: Record<ShareLocale, Record<number, string>> = {
  en: { 1: "Ace", 11: "Page", 12: "Knight", 13: "Queen", 14: "King" },
  ru: { 1: "Туз", 11: "Паж", 12: "Рыцарь", 13: "Королева", 14: "Король" },
};

function markFor(card: TarotCard, locale: ShareLocale): string {
  if (card.arcana === "major") return toRoman(card.number);
  return COURT[locale][card.number] ?? String(card.number);
}

/** Разбирает параметры адреса картинки. Возвращает null, если хоть что-то не сходится с данными колоды. */
export function parseShareRequest(params: URLSearchParams): ShareView | null {
  const spread = getSpreadById(params.get("spread") ?? "");
  if (!spread) return null;

  const locale: ShareLocale = params.get("locale") === "en" ? "en" : "ru";
  const format: ShareFormat = params.get("format") === "post" ? "post" : "story";

  const raw = (params.get("cards") ?? "").split(",").filter(Boolean);
  if (raw.length !== spread.cardCount) return null;

  const seen = new Set<string>();
  const positions = [...spread.positions].sort((a, b) => a.order - b.order);
  const cards: ShareCardView[] = [];
  for (const [index, item] of raw.entries()) {
    const match = /^([a-z0-9-]{2,40})\.(u|r)$/.exec(item);
    const card = match ? getCardById(match[1]) : undefined;
    if (!match || !card || seen.has(card.id)) return null;
    seen.add(card.id);
    cards.push({
      name: getCardName(card, locale),
      position: getPositionLabel(positions[index], locale),
      reversed: match[2] === "r",
      mark: markFor(card, locale),
      suit: card.suit,
    });
  }
  return { spreadName: getSpreadName(spread, locale), cards, locale, format };
}
