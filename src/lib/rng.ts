/**
 * Deterministic RNG. Domain logic (the draw engine) must never call
 * Math.random() directly — every shuffle/orientation roll needs to be
 * reproducible from a stored string seed (see PROJECT_ARCHITECTURE.md §6).
 */

export type RandomSource = () => number;

/** FNV-1a: turns an arbitrary string seed into a 32-bit integer. */
function hashStringToInt(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, good-enough-for-non-cryptographic-use PRNG. */
export function createSeededRandom(seed: string): RandomSource {
  let state = hashStringToInt(seed);
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fisher–Yates, driven entirely by the supplied random source. */
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
