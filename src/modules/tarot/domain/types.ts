export type Arcana = "major" | "minor";

export type Suit = "wands" | "cups" | "swords" | "pentacles";

export type Orientation = "upright" | "reversed";

export type YesNoLeaning = "yes" | "no" | "maybe" | "yes-if-cautious";

export interface TarotCardMeanings {
  upright: string;
  reversed: string;
  love: string;
  career: string;
  finance: string;
  spiritual: string;
  yesNo: YesNoLeaning;
}

/**
 * Шесть полей значений со свободным текстом: `yesNo` — перечисление, не зависящее от языка,
 * поэтому переводу нужны только они.
 */
export type TarotCardMeaningTexts = Omit<TarotCardMeanings, "yesNo">;

export interface TarotCard {
  /** Постоянный slug, например «the-fool», «ace-of-cups». Служит идентификатором-ссылкой в БД. */
  id: string;
  name: string;
  /** Русское название; переводятся только название и описание (не весь объект `meanings`). */
  nameRu: string;
  arcana: Arcana;
  suit: Suit | null;
  /** 0–21 для старших арканов; 1–14 для младших (11 Паж, 12 Рыцарь, 13 Королева, 14 Король). */
  number: number;
  /** Зарезервировано под будущие настоящие иллюстрации. null означает, что рисуется сгенерированное лицо карты. */
  image: string | null;
  keywords: string[];
  keywordsRu: string[];
  description: string;
  descriptionRu: string;
  meanings: TarotCardMeanings;
  meaningsRu: TarotCardMeaningTexts;
}

export interface SpreadPosition {
  id: string;
  order: number;
  label: string;
  labelRu: string;
  meaning: string;
  meaningRu: string;
}

export type SpreadCategory =
  | "general"
  | "love"
  | "career"
  | "decision"
  | "yes-no";

export type SpreadDifficulty = "beginner" | "intermediate" | "advanced";

export interface TarotSpread {
  id: string;
  slug: string;
  name: string;
  nameRu: string;
  description: string;
  descriptionRu: string;
  cardCount: number;
  positions: SpreadPosition[];
  category: SpreadCategory;
  difficulty: SpreadDifficulty;
  isPremium: boolean;
}

export interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: SpreadPosition;
}

export interface DrawResult {
  seed: string;
  cards: DrawnCard[];
}

export interface ReadingCardRecord {
  cardId: string;
  positionId: string;
  orientation: Orientation;
  order: number;
}
