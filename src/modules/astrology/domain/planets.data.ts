import type { PlanetId, ZodiacSignId } from "./types";

export interface PlanetInfo {
  id: PlanetId;
  symbol: string;
  name: string;
  nameRu: string;
  /** Одна строка «чем управляет планета»: складывается со знаком или домом при отображении, это не полноценное эссе. */
  nature: string;
  natureRu: string;
}

export const PLANETS: PlanetInfo[] = [
  { id: "sun", symbol: "☉", name: "Sun", nameRu: "Солнце", nature: "core identity and vitality", natureRu: "ядро личности и жизненная сила" },
  { id: "moon", symbol: "☽", name: "Moon", nameRu: "Луна", nature: "emotional instinct and inner needs", natureRu: "эмоциональные инстинкты и внутренние потребности" },
  {
    id: "mercury",
    symbol: "☿",
    name: "Mercury",
    nameRu: "Меркурий",
    nature: "the way you think and communicate",
    natureRu: "то, как вы мыслите и общаетесь",
  },
  { id: "venus", symbol: "♀", name: "Venus", nameRu: "Венера", nature: "love, values, and what you find beautiful", natureRu: "любовь, ценности и чувство прекрасного" },
  { id: "mars", symbol: "♂", name: "Mars", nameRu: "Марс", nature: "drive, desire, and how you assert yourself", natureRu: "энергия, желание и то, как вы отстаиваете себя" },
  { id: "jupiter", symbol: "♃", name: "Jupiter", nameRu: "Юпитер", nature: "growth, optimism, and where you seek meaning", natureRu: "рост, оптимизм и поиск смысла" },
  { id: "saturn", symbol: "♄", name: "Saturn", nameRu: "Сатурн", nature: "discipline, structure, and long-term responsibility", natureRu: "дисциплина, структура и долгосрочная ответственность" },
  {
    id: "uranus",
    symbol: "♅",
    name: "Uranus",
    nameRu: "Уран",
    nature: "individuality, disruption, and sudden change",
    natureRu: "индивидуальность, слом привычного и внезапные перемены",
  },
  {
    id: "neptune",
    symbol: "♆",
    name: "Neptune",
    nameRu: "Нептун",
    nature: "imagination, intuition, and dissolving boundaries",
    natureRu: "воображение, интуиция и размывание границ",
  },
  {
    id: "pluto",
    symbol: "♇",
    name: "Pluto",
    nameRu: "Плутон",
    nature: "transformation, power, and what gets rebuilt from the ground up",
    natureRu: "трансформация, власть и то, что перестраивается с нуля",
  },
];

const PLANETS_BY_ID = new Map(PLANETS.map((planet) => [planet.id, planet]));

export function requirePlanetById(id: PlanetId): PlanetInfo {
  const planet = PLANETS_BY_ID.get(id);
  if (!planet) throw new Error(`Unknown planet id: "${id}"`);
  return planet;
}

export function localizePlanet(planet: PlanetInfo, locale: "en" | "ru"): PlanetInfo {
  if (locale !== "ru") return planet;
  return { ...planet, name: planet.nameRu, nature: planet.natureRu };
}

/**
 * Соответствие «управитель карты» по традиции, но с современными управителями, которые в коде уже основные
 * в zodiac-signs.data.ts (Плутон/Уран/Нептун для Скорпиона/Водолея/Рыб, а не их классические
 * со-управители): отдельная явная таблица, а не разбор строки `rulingPlanet` в тех данных, которая
 * является прозой («Pluto (traditionally Mars)») и не предназначена для машинного чтения.
 */
export const SIGN_RULER: Record<ZodiacSignId, PlanetId> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "pluto",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "uranus",
  pisces: "neptune",
};
