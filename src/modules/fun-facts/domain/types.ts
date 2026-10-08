/**
 * Общий «словарь архетипов» для вольного сопоставления вытянутой карты старших арканов с актёрами,
 * связанными со схожей энергией. Намеренно небольшой и составленный вручную (не выводится из ключевых
 * слов карт): с обеих сторон сопоставления один и тот же набор тегов, поэтому связь понятна
 * («dreamer» ↔ «dreamer»), а не является результатом нечёткого сходства текстов.
 */
export const ARCHETYPE_TAGS = [
  "pioneer",
  "dreamer",
  "leader",
  "romantic",
  "rebel",
  "healer",
  "sage",
  "trickster",
  "seeker",
  "protector",
  "transformer",
  "visionary",
] as const;

export type ArchetypeTag = (typeof ARCHETYPE_TAGS)[number];

export interface ActorProfile {
  name: string;
  nameRu: string;
  /**
   * Реальная публично известная дата рождения (ISO гггг-мм-дд): знак зодиака и число жизненного пути
   * выводятся из неё и никогда не задаются жёстко, чтобы не разойтись.
   */
  birthDate: string;
  archetypeTags: ArchetypeTag[];
}

export interface ActorFunFact {
  actorName: string;
  reason: string;
}
