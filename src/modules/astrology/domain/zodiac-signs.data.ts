import type { ZodiacSign, ZodiacSignId } from "./types";

/**
 * Sun-sign only for this MVP — a full natal chart needs planetary ephemeris
 * data (positions of the moon, rising sign, etc. at an exact time/place),
 * which is a real sub-project of its own. See PROJECT_ARCHITECTURE.md /
 * TODO.md Phase 8. Tropical zodiac date ranges (standard Western astrology).
 */
export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: "aries",
    name: "Aries",
    nameRu: "Овен",
    symbol: "♈",
    element: "fire",
    modality: "cardinal",
    rulingPlanet: "Mars",
    rulingPlanetRu: "Марс",
    dateRange: { startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    keywords: ["courage", "initiative", "competitiveness"],
    keywordsRu: ["смелость", "инициатива", "соревновательность"],
    description: "The first sign of the zodiac — symbolically associated with new beginnings, bold action, and going first.",
    descriptionRu: "Первый знак зодиака — символически связан с новыми началами, смелыми действиями и умением идти первым.",
    strengths: ["Courage", "Determination", "Directness"],
    strengthsRu: ["Смелость", "Решимость", "Прямота"],
    challenges: ["Impatience", "Impulsiveness", "A short fuse"],
    challengesRu: ["Нетерпение", "Импульсивность", "Вспыльчивость"],
  },
  {
    id: "taurus",
    name: "Taurus",
    nameRu: "Телец",
    symbol: "♉",
    element: "earth",
    modality: "fixed",
    rulingPlanet: "Venus",
    rulingPlanetRu: "Венера",
    dateRange: { startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    keywords: ["stability", "sensuality", "persistence"],
    keywordsRu: ["стабильность", "чувственность", "упорство"],
    description: "An earth sign associated with steadiness, comfort, and a deep appreciation for the physical world.",
    descriptionRu: "Знак земли, связанный с устойчивостью, комфортом и глубокой любовью к физическому миру.",
    strengths: ["Reliability", "Patience", "Practicality"],
    strengthsRu: ["Надёжность", "Терпение", "Практичность"],
    challenges: ["Stubbornness", "Possessiveness", "Resistance to change"],
    challengesRu: ["Упрямство", "Собственничество", "Сопротивление переменам"],
  },
  {
    id: "gemini",
    name: "Gemini",
    nameRu: "Близнецы",
    symbol: "♊",
    element: "air",
    modality: "mutable",
    rulingPlanet: "Mercury",
    rulingPlanetRu: "Меркурий",
    dateRange: { startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
    keywords: ["curiosity", "communication", "versatility"],
    keywordsRu: ["любопытство", "общение", "многосторонность"],
    description: "An air sign associated with quick thinking, conversation, and a restless curiosity about everything at once.",
    descriptionRu: "Знак воздуха, связанный с быстрым мышлением, беседой и неугомонным любопытством ко всему сразу.",
    strengths: ["Adaptability", "Wit", "Sociability"],
    strengthsRu: ["Приспособляемость", "Остроумие", "Общительность"],
    challenges: ["Inconsistency", "Restlessness", "Indecision"],
    challengesRu: ["Непостоянство", "Беспокойство", "Нерешительность"],
  },
  {
    id: "cancer",
    name: "Cancer",
    nameRu: "Рак",
    symbol: "♋",
    element: "water",
    modality: "cardinal",
    rulingPlanet: "Moon",
    rulingPlanetRu: "Луна",
    dateRange: { startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
    keywords: ["nurturing", "intuition", "home"],
    keywordsRu: ["забота", "интуиция", "дом"],
    description: "A water sign associated with emotional depth, protectiveness, and a strong pull toward home and family.",
    descriptionRu: "Знак воды, связанный с эмоциональной глубиной, стремлением защищать и сильной тягой к дому и семье.",
    strengths: ["Empathy", "Loyalty", "Protectiveness"],
    strengthsRu: ["Эмпатия", "Верность", "Стремление защищать"],
    challenges: ["Moodiness", "Over-sensitivity", "Difficulty letting go"],
    challengesRu: ["Переменчивость настроения", "Чрезмерная чувствительность", "Трудности с отпусканием"],
  },
  {
    id: "leo",
    name: "Leo",
    nameRu: "Лев",
    symbol: "♌",
    element: "fire",
    modality: "fixed",
    rulingPlanet: "Sun",
    rulingPlanetRu: "Солнце",
    dateRange: { startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    keywords: ["confidence", "creativity", "generosity"],
    keywordsRu: ["уверенность", "творчество", "щедрость"],
    description: "A fire sign associated with warmth, self-expression, and a natural pull toward the center of the room.",
    descriptionRu: "Знак огня, связанный с теплом, самовыражением и естественной тягой к центру внимания.",
    strengths: ["Warmth", "Leadership", "Charisma"],
    strengthsRu: ["Теплота", "Лидерство", "Харизма"],
    challenges: ["Pride", "Stubbornness", "A need for attention"],
    challengesRu: ["Гордыня", "Упрямство", "Потребность во внимании"],
  },
  {
    id: "virgo",
    name: "Virgo",
    nameRu: "Дева",
    symbol: "♍",
    element: "earth",
    modality: "mutable",
    rulingPlanet: "Mercury",
    rulingPlanetRu: "Меркурий",
    dateRange: { startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    keywords: ["precision", "service", "analysis"],
    keywordsRu: ["точность", "служение", "анализ"],
    description: "An earth sign associated with careful attention, practical skill, and a drive to improve and refine.",
    descriptionRu: "Знак земли, связанный с внимательностью, практическим мастерством и стремлением улучшать и совершенствовать.",
    strengths: ["Diligence", "Practicality", "Attention to detail"],
    strengthsRu: ["Усердие", "Практичность", "Внимание к деталям"],
    challenges: ["Perfectionism", "Overcriticism", "Chronic worry"],
    challengesRu: ["Перфекционизм", "Чрезмерная критичность", "Хроническое беспокойство"],
  },
  {
    id: "libra",
    name: "Libra",
    nameRu: "Весы",
    symbol: "♎",
    element: "air",
    modality: "cardinal",
    rulingPlanet: "Venus",
    rulingPlanetRu: "Венера",
    dateRange: { startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    keywords: ["balance", "harmony", "partnership"],
    keywordsRu: ["баланс", "гармония", "партнёрство"],
    description: "An air sign associated with fairness, aesthetics, and a strong pull toward partnership and balance.",
    descriptionRu: "Знак воздуха, связанный со справедливостью, эстетикой и сильной тягой к партнёрству и равновесию.",
    strengths: ["Diplomacy", "Fairness", "Charm"],
    strengthsRu: ["Дипломатичность", "Справедливость", "Обаяние"],
    challenges: ["Indecisiveness", "Conflict avoidance", "People-pleasing"],
    challengesRu: ["Нерешительность", "Избегание конфликтов", "Стремление угождать"],
  },
  {
    id: "scorpio",
    name: "Scorpio",
    nameRu: "Скорпион",
    symbol: "♏",
    element: "water",
    modality: "fixed",
    rulingPlanet: "Pluto (traditionally Mars)",
    rulingPlanetRu: "Плутон (традиционно Марс)",
    dateRange: { startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    keywords: ["intensity", "transformation", "depth"],
    keywordsRu: ["интенсивность", "трансформация", "глубина"],
    description: "A water sign associated with emotional intensity, transformation, and a comfort with what others avoid looking at.",
    descriptionRu: "Знак воды, связанный с эмоциональной интенсивностью, трансформацией и умением смотреть туда, куда другие избегают смотреть.",
    strengths: ["Passion", "Resilience", "Loyalty"],
    strengthsRu: ["Страсть", "Стойкость", "Верность"],
    challenges: ["Jealousy", "Secretiveness", "Difficulty trusting"],
    challengesRu: ["Ревность", "Скрытность", "Трудности с доверием"],
  },
  {
    id: "sagittarius",
    name: "Sagittarius",
    nameRu: "Стрелец",
    symbol: "♐",
    element: "fire",
    modality: "mutable",
    rulingPlanet: "Jupiter",
    rulingPlanetRu: "Юпитер",
    dateRange: { startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
    keywords: ["exploration", "optimism", "freedom"],
    keywordsRu: ["исследование", "оптимизм", "свобода"],
    description: "A fire sign associated with big-picture thinking, exploration, and a restless need for room to roam.",
    descriptionRu: "Знак огня, связанный с масштабным мышлением, исследованием и неугомонной потребностью в просторе.",
    strengths: ["Enthusiasm", "Honesty", "Open-mindedness"],
    strengthsRu: ["Энтузиазм", "Честность", "Открытость новому"],
    challenges: ["Bluntness", "Restlessness", "Overpromising"],
    challengesRu: ["Прямолинейность", "Беспокойство", "Излишние обещания"],
  },
  {
    id: "capricorn",
    name: "Capricorn",
    nameRu: "Козерог",
    symbol: "♑",
    element: "earth",
    modality: "cardinal",
    rulingPlanet: "Saturn",
    rulingPlanetRu: "Сатурн",
    dateRange: { startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    keywords: ["ambition", "discipline", "responsibility"],
    keywordsRu: ["амбиции", "дисциплина", "ответственность"],
    description: "An earth sign associated with long-term ambition, structure, and a willingness to put in the work others skip.",
    descriptionRu:
      "Знак земли, связанный с долгосрочными амбициями, структурой и готовностью делать работу, которую другие пропускают.",
    strengths: ["Patience", "Determination", "Practicality"],
    strengthsRu: ["Терпение", "Решимость", "Практичность"],
    challenges: ["Rigidity", "Pessimism", "Workaholism"],
    challengesRu: ["Жёсткость", "Пессимизм", "Трудоголизм"],
  },
  {
    id: "aquarius",
    name: "Aquarius",
    nameRu: "Водолей",
    symbol: "♒",
    element: "air",
    modality: "fixed",
    rulingPlanet: "Uranus (traditionally Saturn)",
    rulingPlanetRu: "Уран (традиционно Сатурн)",
    dateRange: { startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    keywords: ["originality", "independence", "idealism"],
    keywordsRu: ["оригинальность", "независимость", "идеализм"],
    description: "An air sign associated with individuality, big ideas, and a genuine investment in the collective good.",
    descriptionRu: "Знак воздуха, связанный с индивидуальностью, большими идеями и искренней заботой об общем благе.",
    strengths: ["Innovation", "Humanitarianism", "Individuality"],
    strengthsRu: ["Новаторство", "Гуманизм", "Индивидуальность"],
    challenges: ["Emotional detachment", "Stubbornness", "Unpredictability"],
    challengesRu: ["Эмоциональная отстранённость", "Упрямство", "Непредсказуемость"],
  },
  {
    id: "pisces",
    name: "Pisces",
    nameRu: "Рыбы",
    symbol: "♓",
    element: "water",
    modality: "mutable",
    rulingPlanet: "Neptune (traditionally Jupiter)",
    rulingPlanetRu: "Нептун (традиционно Юпитер)",
    dateRange: { startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    keywords: ["intuition", "empathy", "imagination"],
    keywordsRu: ["интуиция", "эмпатия", "воображение"],
    description: "A water sign associated with dreams, compassion, and a porous boundary between itself and everyone around it.",
    descriptionRu: "Знак воды, связанный с мечтами, состраданием и почти прозрачной границей между собой и всеми вокруг.",
    strengths: ["Compassion", "Creativity", "Adaptability"],
    strengthsRu: ["Сострадание", "Творчество", "Приспособляемость"],
    challenges: ["Escapism", "Over-idealism", "Difficulty with boundaries"],
    challengesRu: ["Эскапизм", "Чрезмерный идеализм", "Трудности с границами"],
  },
];

const ZODIAC_BY_ID = new Map(ZODIAC_SIGNS.map((sign) => [sign.id, sign]));

export function getAllZodiacSigns(): readonly ZodiacSign[] {
  return ZODIAC_SIGNS;
}

export function getZodiacSignById(id: ZodiacSignId): ZodiacSign | undefined {
  return ZODIAC_BY_ID.get(id);
}

export function requireZodiacSignById(id: ZodiacSignId): ZodiacSign {
  const sign = getZodiacSignById(id);
  if (!sign) throw new Error(`Unknown zodiac sign id: "${id}"`);
  return sign;
}

/**
 * Fixed astronomical fact (tropical zodiac): 0°–30° ecliptic longitude is
 * Aries, 30°–60° Taurus, and so on — independent of `ZODIAC_SIGNS`' own
 * array order, which is why this is its own small lookup table rather than
 * indexing into that array directly.
 */
const ZODIAC_LONGITUDE_ORDER: ZodiacSignId[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

/** Used by the natal chart (services/calculate-natal-chart.ts) to turn a computed ecliptic longitude into a sign + degree-in-sign. */
export function getZodiacSignByLongitude(longitudeDeg: number): { sign: ZodiacSign; degreeInSign: number } {
  const normalized = ((longitudeDeg % 360) + 360) % 360;
  const index = Math.floor(normalized / 30) % 12;
  return { sign: requireZodiacSignById(ZODIAC_LONGITUDE_ORDER[index]), degreeInSign: normalized - index * 30 };
}

/**
 * The sign with its translatable fields swapped for the requested language.
 * Same shape in, same shape out, so callers just pipe a sign through this
 * and keep rendering `sign.name`, `sign.description`, etc. as before.
 */
export function localizeZodiacSign(sign: ZodiacSign, locale: "en" | "ru"): ZodiacSign {
  if (locale !== "ru") return sign;
  return {
    ...sign,
    name: sign.nameRu,
    rulingPlanet: sign.rulingPlanetRu,
    keywords: sign.keywordsRu,
    description: sign.descriptionRu,
    strengths: sign.strengthsRu,
    challenges: sign.challengesRu,
  };
}
