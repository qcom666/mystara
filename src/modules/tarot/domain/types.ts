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

/** The six free-text meaning fields — `yesNo` is a language-independent enum, so a translation only needs these. */
export type TarotCardMeaningTexts = Omit<TarotCardMeanings, "yesNo">;

export interface TarotCard {
  /** Stable slug, e.g. "the-fool", "ace-of-cups". Used as the DB reference id. */
  id: string;
  name: string;
  /** Russian name — see PROJECT_ARCHITECTURE.md §14 for why only name/description (not the full `meanings`) are localized. */
  nameRu: string;
  arcana: Arcana;
  suit: Suit | null;
  /** 0–21 for Major Arcana; 1–14 for Minor (11 Page, 12 Knight, 13 Queen, 14 King). */
  number: number;
  /** Reserved for future real artwork (see Decision Log #3). Null renders a procedural card face. */
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
