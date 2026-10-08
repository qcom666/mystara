import type { ArchetypeTag } from "./types";

/**
 * Сопоставляет каждой карте старших арканов 1–2 тега из того же словаря ARCHETYPE_TAGS, что
 * используется для актёров (см. types.ts). Хранится здесь, а не в данных самой карты: это игровое
 * содержимое, а не часть основной модели таро.
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
