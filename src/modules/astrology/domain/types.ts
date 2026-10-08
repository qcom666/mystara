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
  // Русские пары всех переводимых полей. `element` и `modality` — не зависящие от языка идентификаторы:
  // интерфейс подписывает их через словарь i18n.
  nameRu: string;
  rulingPlanetRu: string;
  keywordsRu: string[];
  descriptionRu: string;
  strengthsRu: string[];
  challengesRu: string[];
}

/** Секта (эллинистическая астрология): дневная и ночная карта; см. sect.data.ts. */
export type Sect = "day" | "night";

export interface SectProfile {
  id: Sect;
  title: string;
  description: string;
  /** Английские названия планет: интерфейс сопоставляет их через словарь i18n `planets`. */
  favoredPlanets: string[];
  keynote: string;
  titleRu: string;
  descriptionRu: string;
  keynoteRu: string;
}

// --- Натальная карта (см. services/calculate-natal-chart.ts), платная функция ---

export type PlanetId = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface NatalChartInput {
  /** Момент рождения в UTC: вызывающий код уже привёл его из местного времени и часового пояса. */
  birthDateUtc: Date;
  /** false, если пользователь не знает точное время рождения: дома, асцендент и MC тогда не считаются, а не угадываются. */
  hasExactTime: boolean;
  latitude: number;
  longitude: number;
}

export interface PlanetPlacement {
  planet: PlanetId;
  longitudeDeg: number;
  sign: ZodiacSignId;
  /** Градусы внутри знака `sign`, 0–30. */
  degreeInSign: number;
  /** Номер дома по системе целых знаков, 1–12; есть только если `hasExactTime` было true. */
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
  /** На сколько градусов аспект отклоняется от точного (0 = точный). */
  orb: number;
}

export interface NatalChart {
  planets: PlanetPlacement[];
  /** null, если `hasExactTime` было false: для асцендента нужно настоящее время рождения. */
  ascendant: ChartAngle | null;
  midheaven: ChartAngle | null;
  /** Традиционный управитель знака асцендента, например Марс для Овна. null вместе с `ascendant`. */
  chartRuler: PlanetId | null;
  aspects: ChartAspect[];
}
