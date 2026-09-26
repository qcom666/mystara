export type ZodiacSignId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type Element = "fire" | "earth" | "air" | "water";
export type Modality = "cardinal" | "fixed" | "mutable";

export interface ZodiacDateRange {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface ZodiacSign {
  id: ZodiacSignId;
  name: string;
  symbol: string;
  element: Element;
  modality: Modality;
  rulingPlanet: string;
  dateRange: ZodiacDateRange;
  keywords: string[];
  description: string;
  strengths: string[];
  challenges: string[];
  // Russian twins of every translatable field. `element`/`modality` are
  // language-independent ids — the UI labels them through the i18n dictionary.
  nameRu: string;
  rulingPlanetRu: string;
  keywordsRu: string[];
  descriptionRu: string;
  strengthsRu: string[];
  challengesRu: string[];
}

/** Sect (Hellenistic astrology): diurnal (day) vs nocturnal (night) chart — see sect.data.ts. */
export type Sect = "day" | "night";

export interface SectProfile {
  id: Sect;
  title: string;
  description: string;
  /** English planet names — the UI maps them through the i18n `planets` dictionary. */
  favoredPlanets: string[];
  keynote: string;
  titleRu: string;
  descriptionRu: string;
  keynoteRu: string;
}
