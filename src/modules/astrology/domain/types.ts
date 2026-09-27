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

// --- Natal chart (see services/calculate-natal-chart.ts) — Premium feature, see PROJECT_ARCHITECTURE.md §17b ---

export type PlanetId = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface NatalChartInput {
  /** UTC instant of birth — already resolved from local time + timezone by the caller. */
  birthDateUtc: Date;
  /** False when the user doesn't know their exact birth time — houses/Ascendant/MC are omitted rather than guessed. */
  hasExactTime: boolean;
  latitude: number;
  longitude: number;
}

export interface PlanetPlacement {
  planet: PlanetId;
  longitudeDeg: number;
  sign: ZodiacSignId;
  /** Degrees into `sign`, 0–30. */
  degreeInSign: number;
  /** Whole-sign house number, 1–12 — only present when `hasExactTime` was true. */
  house: number | null;
  isRetrograde: boolean | null;
}

export interface ChartAngle {
  longitudeDeg: number;
  sign: ZodiacSignId;
  degreeInSign: number;
}

export interface ChartAspect {
  a: PlanetId;
  b: PlanetId;
  type: AspectType;
  /** How many degrees off an exact aspect this is (0 = exact). */
  orb: number;
}

export interface NatalChart {
  planets: PlanetPlacement[];
  /** Null when `hasExactTime` was false — an Ascendant needs a real birth time. */
  ascendant: ChartAngle | null;
  midheaven: ChartAngle | null;
  /** Traditional ruler of the Ascendant's sign — e.g. Mars rules Aries. Null alongside `ascendant`. */
  chartRuler: PlanetId | null;
  aspects: ChartAspect[];
}
