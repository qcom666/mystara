import {
  type AspectBand,
  type AspectDefinition,
  FRIENDSHIP_ASPECTS,
  FRIENDSHIP_VERDICTS,
  type FriendshipAspectId,
  LOVE_ASPECTS,
  LOVE_VERDICTS,
  type LoveAspectId,
  SIGN_TRAITS,
  type TraitId,
} from "../domain/compatibility-details.data";
import { pairKey } from "../domain/compatibility.data";
import type { Bilingual } from "../domain/horoscope.data";
import type { Element, ZodiacSignId } from "../domain/types";
import { requireZodiacSignById } from "../domain/zodiac-signs.data";
import { allCompatibilitySlugs, canonicalPair, compatibilitySlug, getCompatibility, parseCompatibilitySlug, signDistance } from "./compatibility";

export type CompatibilityMode = "love" | "friendship";

export interface AspectScore {
  id: LoveAspectId | FriendshipAspectId;
  score: number;
  band: AspectBand;
  title: Bilingual;
  text: Bilingual;
}

export interface DetailedCompatibility {
  mode: CompatibilityMode;
  /** Пара в каноническом порядке (по кругу зодиака, от Овна). */
  first: ZodiacSignId;
  second: ZodiacSignId;
  overall: number;
  verdict: Bilingual;
  aspects: AspectScore[];
  /** Три самых сильных и три самых слабых пункта: «сильные стороны» и «над чем поработать». */
  strengths: AspectScore[];
  growth: AspectScore[];
  /** Общие тексты пары: суть сочетания, стихии, ритм и совет (services/compatibility.ts). */
  summary: Bilingual;
  elements: Bilingual;
  modalities: Bilingual;
  advice: Bilingual;
}

/**
 * Насколько расстояние по кругу зодиака помогает ладить: тот же знак, соседи, секстиль, квадрат, трин,
 * квинконс, оппозиция. Трин и секстиль — лёгкие аспекты, квадрат и квинконс — напряжённые.
 */
const HARMONY = [0.5, -0.1, 0.7, -0.5, 1, -0.6, 0.2] as const;
/** «Искра» аспекта: напряжённые квадрат и оппозиция дают сильное притяжение, хоть и с трением. */
const CHEMISTRY = [0.4, 0.1, 0.5, 0.9, 0.6, 0.3, 1] as const;

/** Насколько легко стихиям понимать друг друга: одна стихия и союзные пары (огонь+воздух, земля+вода) — легко. */
const ELEMENT_FLOW: Record<string, number> = {
  [pairKey<Element>("fire", "fire")]: 1,
  [pairKey<Element>("earth", "earth")]: 1,
  [pairKey<Element>("air", "air")]: 1,
  [pairKey<Element>("water", "water")]: 1,
  [pairKey<Element>("fire", "air")]: 0.7,
  [pairKey<Element>("earth", "water")]: 0.7,
  [pairKey<Element>("fire", "earth")]: -0.3,
  [pairKey<Element>("fire", "water")]: -0.4,
  [pairKey<Element>("air", "earth")]: -0.4,
  [pairKey<Element>("air", "water")]: -0.3,
};

/** «Жар» сочетания стихий: огонь с огнём и огонь с водой (пар) — самые страстные. */
const ELEMENT_HEAT: Record<string, number> = {
  [pairKey<Element>("fire", "fire")]: 0.9,
  [pairKey<Element>("fire", "water")]: 0.7,
  [pairKey<Element>("fire", "air")]: 0.6,
  [pairKey<Element>("water", "water")]: 0.6,
  [pairKey<Element>("earth", "water")]: 0.5,
  [pairKey<Element>("earth", "earth")]: 0.4,
  [pairKey<Element>("fire", "earth")]: 0.3,
  [pairKey<Element>("air", "air")]: 0.2,
  [pairKey<Element>("air", "water")]: 0.2,
  [pairKey<Element>("air", "earth")]: 0.1,
};

const MIN_SCORE = 25;
const MAX_SCORE = 98;
const clamp = (value: number) => Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(value)));

/**
 * Общий итог — средневзвешенное пунктов, растянутое от середины шкалы: среднее сглаживает крайности, и без
 * растяжки лучшие и худшие пары сходились бы к 50–80 %. Ниже 38 % итог не опускается.
 */
const OVERALL_CENTER = 62;
const OVERALL_STRETCH = 1.5;
const OVERALL_MIN = 38;

export function scoreBand(score: number): AspectBand {
  if (score >= 75) return "high";
  if (score >= 55) return "mid";
  return "low";
}

/** Всё, из чего складываются оценки пары. */
interface PairFactors {
  harmony: number;
  chemistry: number;
  flow: number;
  heat: number;
  sameModality: boolean;
  /** Квадрат: одинаковый крест, но разные стихии — самое «упрямое» сочетание. */
  square: boolean;
  samePolarity: boolean;
  /** Средний уровень черты у пары, 0–1. */
  avg: (trait: TraitId) => number;
  /** Сходство пары по черте, 0–1 (1 — одинаково). */
  sim: (trait: TraitId) => number;
  /** Черта у того из двоих, у кого она слабее, 0–1. */
  min: (trait: TraitId) => number;
}

const isYang = (element: Element) => element === "fire" || element === "air";

function pairFactors(first: ZodiacSignId, second: ZodiacSignId): PairFactors {
  const a = requireZodiacSignById(first);
  const b = requireZodiacSignById(second);
  const ta = SIGN_TRAITS[first];
  const tb = SIGN_TRAITS[second];
  const distance = signDistance(first, second);
  const elements = pairKey(a.element, b.element);
  return {
    harmony: HARMONY[distance],
    chemistry: CHEMISTRY[distance],
    flow: ELEMENT_FLOW[elements],
    heat: ELEMENT_HEAT[elements],
    sameModality: a.modality === b.modality,
    square: distance === 3,
    samePolarity: isYang(a.element) === isYang(b.element),
    avg: (trait) => (ta[trait] + tb[trait]) / 20,
    sim: (trait) => 1 - Math.abs(ta[trait] - tb[trait]) / 10,
    min: (trait) => Math.min(ta[trait], tb[trait]) / 10,
  };
}

/** Упрямство обоих и спор «на равных» (одинаковый крест) мешают договариваться. */
function conflictScore(f: PairFactors): number {
  return 58 + 16 * f.harmony + 6 * f.flow - 22 * (f.avg("stubborn") - 0.5) - (f.square ? 8 : f.sameModality ? 4 : 0);
}

/** Одинаковая потребность в свободе — главное; лёгкий аспект помогает договориться о разной. */
function freedomScore(f: PairFactors): number {
  return 56 + 26 * (f.sim("freedom") - 0.6) + 8 * f.harmony + 4 * f.flow;
}

function loveScores(f: PairFactors): Record<LoveAspectId, number> {
  const attraction = 52 + 22 * f.chemistry + 14 * (f.heat - 0.4) + 18 * (f.avg("passion") - 0.6);
  const emotional = 54 + 16 * f.harmony + 12 * f.flow + 16 * (f.avg("tenderness") - 0.55) + 8 * (f.sim("tenderness") - 0.6);
  const communication = 54 + 14 * f.harmony + 10 * f.flow + 18 * (f.avg("talk") - 0.6) + 8 * (f.sim("talk") - 0.6);
  const trust = 56 + 12 * f.harmony + 6 * f.flow + 26 * (f.min("loyalty") - 0.55) + 8 * (f.sim("freedom") - 0.6);
  const values = 54 + 18 * f.harmony + 12 * f.flow + 10 * (f.sim("ambition") - 0.6) + (f.samePolarity ? 4 : -3);
  const everyday = 54 + 8 * f.harmony + 8 * f.flow + 20 * (f.avg("practicality") - 0.55) + 10 * (f.sim("practicality") - 0.6) - (f.square ? 5 : 0);
  const tenderness = 54 + 16 * f.chemistry + 12 * (f.heat - 0.4) + 28 * (f.avg("tenderness") - 0.55) + 12 * (f.avg("passion") - 0.6) + 6 * f.harmony;
  const conflicts = conflictScore(f);
  const fun = 54 + 12 * f.harmony + 30 * (f.avg("fun") - 0.55) + 14 * (f.sim("fun") - 0.6) + (f.samePolarity ? 3 : 0);
  const freedom = freedomScore(f);
  const growth = 52 + 12 * f.harmony + 14 * f.chemistry + 28 * (f.avg("ambition") - 0.55) + (f.samePolarity ? 0 : 4);
  const longTerm = (clamp(trust) * 1.3 + clamp(values) + clamp(conflicts) + clamp(emotional) + clamp(everyday) * 0.7) / 5 + 6 * f.harmony;
  return { attraction, emotional, communication, trust, values, everyday, tenderness, conflicts, fun, freedom, growth, longTerm };
}

function friendshipScores(f: PairFactors): Record<FriendshipAspectId, number> {
  const interests = 54 + 14 * f.harmony + 12 * f.flow + 12 * (f.sim("adventure") - 0.6) + 8 * (f.sim("fun") - 0.6);
  const understanding = 56 + 18 * f.harmony + 14 * f.flow + 8 * (f.sim("talk") - 0.6);
  const trust = 56 + 10 * f.harmony + 6 * f.flow + 24 * (f.min("loyalty") - 0.55) + 8 * (f.avg("tenderness") - 0.5);
  const support = 56 + 10 * f.harmony + 6 * f.flow + 16 * (f.avg("tenderness") - 0.55) + 12 * (f.min("loyalty") - 0.55);
  const adventures = 54 + 8 * f.harmony + 8 * f.chemistry + 32 * (f.avg("adventure") - 0.55) + 16 * (f.sim("adventure") - 0.6);
  const humor = 56 + 12 * f.harmony + 30 * (f.avg("fun") - 0.55) + 16 * (f.sim("fun") - 0.6);
  const reliability = 56 + 8 * f.harmony + 28 * (f.avg("loyalty") - 0.6) + 22 * (f.avg("practicality") - 0.55) + 8 * (f.sim("practicality") - 0.6);
  const conflicts = conflictScore(f) + 2;
  const projects = 54 + 10 * f.harmony + 14 * (f.avg("ambition") - 0.55) + 12 * (f.avg("practicality") - 0.55) + (f.sameModality ? -5 : 4);
  const freedom = freedomScore(f) + 3;
  const inspiration = 52 + 16 * f.chemistry + 10 * f.harmony + 20 * (f.avg("ambition") - 0.55) + 12 * (f.avg("adventure") - 0.55) + (f.samePolarity ? 0 : 3);
  const lasting = (clamp(trust) * 1.3 + clamp(reliability) + clamp(understanding) + clamp(conflicts) + clamp(support)) / 5.3 + 6 * f.harmony;
  return { interests, understanding, trust, support, adventures, humor, reliability, conflicts, projects, freedom, inspiration, lasting };
}

function verdictFor(overall: number, verdicts: { min: number; text: Bilingual }[]): Bilingual {
  return (verdicts.find((verdict) => overall >= verdict.min) ?? verdicts[verdicts.length - 1]).text;
}

function build<Id extends string>(raw: Record<Id, number>, definitions: AspectDefinition<Id>[]): { aspects: AspectScore[]; overall: number } {
  const aspects: AspectScore[] = definitions.map((definition) => {
    const score = clamp(raw[definition.id]);
    const band = scoreBand(score);
    return { id: definition.id as AspectScore["id"], score, band, title: definition.title, text: definition.text[band] };
  });
  const totalWeight = definitions.reduce((sum, definition) => sum + definition.weight, 0);
  const average = aspects.reduce((sum, aspect, index) => sum + aspect.score * definitions[index].weight, 0) / totalWeight;
  const overall = Math.max(OVERALL_MIN, clamp(OVERALL_CENTER + (average - OVERALL_CENTER) * OVERALL_STRETCH));
  return { aspects, overall };
}

/**
 * Подробная совместимость пары в любви или дружбе: 12 пунктов в процентах, общий итог, сильные стороны и зоны
 * роста. Симметрична и детерминирована: оценки складываются из расстояния между знаками по кругу (гармония и
 * «искра» аспекта), сочетания стихий, крестов и полярности, а также традиционных черт каждого знака
 * (SIGN_TRAITS). Тексты пары берутся из общей совместимости знаков.
 */
export function getDetailedCompatibility(a: ZodiacSignId, b: ZodiacSignId, mode: CompatibilityMode): DetailedCompatibility {
  const [first, second] = canonicalPair(a, b);
  const factors = pairFactors(first, second);
  const { aspects, overall } =
    mode === "love" ? build(loveScores(factors), LOVE_ASPECTS) : build(friendshipScores(factors), FRIENDSHIP_ASPECTS);
  const ranked = [...aspects].sort((x, y) => y.score - x.score);
  const general = getCompatibility(first, second);
  return {
    mode,
    first,
    second,
    overall,
    verdict: verdictFor(overall, mode === "love" ? LOVE_VERDICTS : FRIENDSHIP_VERDICTS),
    aspects,
    strengths: ranked.slice(0, 3),
    growth: ranked.slice(-3).reverse(),
    summary: general.summary,
    elements: general.elements,
    modalities: general.modalities,
    advice: general.advice,
  };
}

/** Страница выбора пары для режима. */
export const COMPATIBILITY_INDEX_PATH: Record<CompatibilityMode, string> = {
  love: "/astrology/compatibility",
  friendship: "/astrology/compatibility/friendship",
};

/** Страница пары: любовь — «/astrology/compatibility/aries-leo», дружба — «/astrology/compatibility/friendship/aries-leo». */
export function compatibilityPath(mode: CompatibilityMode, a: ZodiacSignId, b: ZodiacSignId): string {
  return `${COMPATIBILITY_INDEX_PATH[mode]}/${compatibilitySlug(a, b)}`;
}

/** Самые гармоничные пары режима (без пар одного знака) — подборка ссылок на странице выбора. */
export function topPairs(mode: CompatibilityMode, count: number): DetailedCompatibility[] {
  return allCompatibilitySlugs()
    .map((slug) => parseCompatibilitySlug(slug))
    .filter((pair): pair is [ZodiacSignId, ZodiacSignId] => pair !== null && pair[0] !== pair[1])
    .map(([a, b]) => getDetailedCompatibility(a, b, mode))
    .sort((x, y) => y.overall - x.overall || compatibilitySlug(x.first, x.second).localeCompare(compatibilitySlug(y.first, y.second)))
    .slice(0, count);
}
