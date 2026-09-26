export type LifePathNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

/** Chaldean (ancient, Babylonian-derived) vs Pythagorean (modern, standard) letter-number systems. */
export type NumerologySystem = "pythagorean" | "chaldean";

/** The language-specific text of a Life Path entry — what `getLifePathMeaning(number, locale)` returns. */
export interface LifePathMeaning {
  number: LifePathNumber;
  title: string;
  keywords: string[];
  description: string;
  strengths: string[];
  challenges: string[];
}

/** Stored form: English fields plus a `*Ru` twin of each translatable field. */
export interface LifePathMeaningSource extends LifePathMeaning {
  titleRu: string;
  keywordsRu: string[];
  descriptionRu: string;
  strengthsRu: string[];
  challengesRu: string[];
}

/** The five core numbers of a full numerology profile, plus which letter system produced the name-derived ones. */
export interface NumerologyProfile {
  system: NumerologySystem;
  lifePathNumber: LifePathNumber;
  birthdayNumber: LifePathNumber;
  expressionNumber: LifePathNumber;
  soulUrgeNumber: LifePathNumber;
  personalityNumber: LifePathNumber;
  maturityNumber: LifePathNumber;
}

export type NumerologyNumberType = "lifePath" | "birthday" | "expression" | "soulUrge" | "personality" | "maturity";
