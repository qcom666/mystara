/**
 * Shared "archetype vocabulary" used to loosely match a drawn Major Arcana
 * card to actors associated with a similar energy. Deliberately small and
 * hand-curated (not derived from card keywords directly) — it's the same
 * tag set on both sides of the match, which keeps the connection legible
 * ("dreamer" ↔ "dreamer") instead of a fuzzy text-similarity guess.
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
  /** Real, publicly known birthdate (ISO yyyy-mm-dd) — zodiac sign and life path number are derived from it, never hardcoded, so they can't drift out of sync. */
  birthDate: string;
  archetypeTags: ArchetypeTag[];
}

export interface ActorFunFact {
  actorName: string;
  reason: string;
}
