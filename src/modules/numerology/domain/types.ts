export type LifePathNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

/**
 * Халдейская (древняя, вавилонского происхождения) и пифагорейская (современная, стандартная)
 * системы соответствия букв и чисел.
 */
export type NumerologySystem = "pythagorean" | "chaldean";

/** Текст записи числа жизненного пути на одном языке: то, что возвращает `getLifePathMeaning(number, locale)`. */
export interface LifePathMeaning {
  number: LifePathNumber;
  title: string;
  keywords: string[];
  description: string;
  strengths: string[];
  challenges: string[];
}

/** Хранимая форма: английские поля плюс пара `*Ru` для каждого переводимого поля. */
export interface LifePathMeaningSource extends LifePathMeaning {
  titleRu: string;
  keywordsRu: string[];
  descriptionRu: string;
  strengthsRu: string[];
  challengesRu: string[];
}

/**
 * Пять основных чисел полного нумерологического профиля и система букв, по которой посчитаны
 * числа по имени.
 */
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
