import type { ArchetypeTag } from "./types";

/**
 * Maps each Major Arcana card to 1–2 tags from the same ARCHETYPE_TAGS
 * vocabulary used for actors (see types.ts) — kept here rather than on the
 * card data itself, since this is playful fun-fact content, not part of the
 * core Tarot domain model.
 */
export const MAJOR_ARCANA_ARCHETYPES: Record<string, ArchetypeTag[]> = {
  "the-fool": ["seeker", "pioneer"],
  "the-magician": ["visionary", "pioneer"],
  "the-high-priestess": ["sage", "seeker"],
  "the-empress": ["healer", "romantic"],
  "the-emperor": ["leader", "protector"],
  "the-hierophant": ["sage", "leader"],
  "the-lovers": ["romantic", "seeker"],
  "the-chariot": ["leader", "pioneer"],
  strength: ["healer", "protector"],
  "the-hermit": ["sage", "seeker"],
  "wheel-of-fortune": ["trickster", "transformer"],
  justice: ["sage", "leader"],
  "the-hanged-man": ["seeker", "dreamer"],
  death: ["transformer", "rebel"],
  temperance: ["healer", "sage"],
  "the-devil": ["rebel", "trickster"],
  "the-tower": ["rebel", "transformer"],
  "the-star": ["dreamer", "healer"],
  "the-moon": ["dreamer", "seeker"],
  "the-sun": ["leader", "romantic"],
  judgement: ["transformer", "visionary"],
  "the-world": ["visionary", "transformer"],
};
