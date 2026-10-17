import {
  DISTANCE_PROFILES,
  type DistanceProfile,
  ELEMENT_PAIRS,
  MODALITY_PAIRS,
  pairKey,
  type SignDistance,
} from "../domain/compatibility.data";
import type { Bilingual } from "../domain/horoscope.data";
import type { ZodiacSignId } from "../domain/types";
import { getAllZodiacSigns, requireZodiacSignById } from "../domain/zodiac-signs.data";

export interface Compatibility {
  /** Пара в каноническом порядке (по кругу зодиака, от Овна). */
  first: ZodiacSignId;
  second: ZodiacSignId;
  distance: SignDistance;
  scores: { overall: number; love: number; friendship: number; work: number };
  title: Bilingual;
  summary: Bilingual;
  elements: Bilingual;
  modalities: Bilingual;
  advice: Bilingual;
}

const SIGN_ORDER = getAllZodiacSigns().map((sign) => sign.id);
const clampScore = (value: number) => Math.min(98, Math.max(20, Math.round(value)));

/** Кратчайшее расстояние между знаками по кругу, 0–6. */
export function signDistance(a: ZodiacSignId, b: ZodiacSignId): SignDistance {
  const diff = Math.abs(SIGN_ORDER.indexOf(a) - SIGN_ORDER.indexOf(b));
  return Math.min(diff, 12 - diff) as SignDistance;
}

/** Пара знаков в каноническом порядке: от этого зависят адрес страницы и порядок в заголовке. */
export function canonicalPair(a: ZodiacSignId, b: ZodiacSignId): [ZodiacSignId, ZodiacSignId] {
  return SIGN_ORDER.indexOf(a) <= SIGN_ORDER.indexOf(b) ? [a, b] : [b, a];
}

/**
 * Совместимость двух знаков. Симметрична и детерминирована: оценки выводятся из расстояния между
 * знаками, сочетания стихий и крестов, без случайности, поэтому у пары всегда один результат.
 */
export function getCompatibility(a: ZodiacSignId, b: ZodiacSignId): Compatibility {
  const [first, second] = canonicalPair(a, b);
  const signA = requireZodiacSignById(first);
  const signB = requireZodiacSignById(second);
  const distance = signDistance(first, second);
  const profile: DistanceProfile = DISTANCE_PROFILES[distance];
  const elements = ELEMENT_PAIRS[pairKey(signA.element, signB.element)];
  const modalities = MODALITY_PAIRS[pairKey(signA.modality, signB.modality)];

  const love = clampScore(profile.score + elements.love);
  const friendship = clampScore(profile.score + elements.friendship);
  const work = clampScore(profile.score + modalities.work);
  return {
    first,
    second,
    distance,
    scores: { overall: clampScore((love + friendship + work) / 3), love, friendship, work },
    title: profile.title,
    summary: profile.summary,
    elements: elements.text,
    modalities: modalities.text,
    advice: profile.advice,
  };
}

/** Адрес страницы пары: «aries-leo». */
export function compatibilitySlug(a: ZodiacSignId, b: ZodiacSignId): string {
  return canonicalPair(a, b).join("-");
}

export function parseCompatibilitySlug(slug: string): [ZodiacSignId, ZodiacSignId] | null {
  const parts = slug.split("-");
  if (parts.length !== 2) return null;
  const [a, b] = parts as [ZodiacSignId, ZodiacSignId];
  return SIGN_ORDER.includes(a) && SIGN_ORDER.includes(b) ? [a, b] : null;
}

export function allCompatibilitySlugs(): string[] {
  const slugs: string[] = [];
  for (let i = 0; i < SIGN_ORDER.length; i++) {
    for (let j = i; j < SIGN_ORDER.length; j++) slugs.push(`${SIGN_ORDER[i]}-${SIGN_ORDER[j]}`);
  }
  return slugs;
}
