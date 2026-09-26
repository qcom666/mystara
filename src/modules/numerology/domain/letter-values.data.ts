import type { NumerologySystem } from "./types";

/**
 * Two real, traditional letter-to-number systems — not a single "modern"
 * invention. Pythagorean is the standard modern system (a simple 1–9 cycle
 * through the alphabet). Chaldean is the older Babylonian-derived system,
 * based on sound/vibration rather than alphabet order, and deliberately
 * assigns no letter to 9 (considered too sacred/complete a number to tie to
 * a single letter). Both are widely published, traditional systems — not
 * unique to any one book.
 */
const PYTHAGOREAN_VALUES: Record<string, number> = {
  A: 1,
  J: 1,
  S: 1,
  B: 2,
  K: 2,
  T: 2,
  C: 3,
  L: 3,
  U: 3,
  D: 4,
  M: 4,
  V: 4,
  E: 5,
  N: 5,
  W: 5,
  F: 6,
  O: 6,
  X: 6,
  G: 7,
  P: 7,
  Y: 7,
  H: 8,
  Q: 8,
  Z: 8,
  I: 9,
  R: 9,
};

const CHALDEAN_VALUES: Record<string, number> = {
  A: 1,
  I: 1,
  J: 1,
  Q: 1,
  Y: 1,
  B: 2,
  K: 2,
  R: 2,
  C: 3,
  G: 3,
  L: 3,
  S: 3,
  D: 4,
  M: 4,
  T: 4,
  E: 5,
  H: 5,
  N: 5,
  X: 5,
  U: 6,
  V: 6,
  W: 6,
  O: 7,
  Z: 7,
  F: 8,
  P: 8,
  // No letter maps to 9 in the Chaldean system.
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

/**
 * Russian names. The standard Russian Pythagorean table is the same idea as
 * the Latin one — cycle 1–9 through the alphabet in order — applied to the
 * 33-letter Russian alphabet (А=1 … З=9, И=1 … Р=9, С=1 … Щ=9, Ъ=1 … Я=6).
 * There is no canonical Cyrillic *Chaldean* table (the system is built on
 * the sounds of a specific ancient alphabet), so Chaldean values for a
 * Cyrillic letter are those of its Latin transliteration, summed.
 */
const RU_ALPHABET = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const RU_PYTHAGOREAN_VALUES: Record<string, number> = Object.fromEntries([...RU_ALPHABET].map((letter, index) => [letter, (index % 9) + 1]));

const RU_TO_LATIN: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "ZH", З: "Z", И: "I", Й: "Y", К: "K", Л: "L", М: "M",
  Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "KH", Ц: "TS", Ч: "CH", Ш: "SH", Щ: "SHCH",
  Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "YU", Я: "YA",
};

const RU_VOWELS = new Set(["А", "Е", "Ё", "И", "О", "У", "Ы", "Э", "Ю", "Я"]);

/** A letter this module can turn into a number: Latin A–Z or Russian Cyrillic. */
export function isRecognizedLetter(character: string): boolean {
  return /^[A-ZА-ЯЁ]$/.test(character.toUpperCase());
}

export function isCyrillic(text: string): boolean {
  return /[А-ЯЁа-яё]/.test(text);
}

export function getLetterValue(letter: string, system: NumerologySystem): number {
  const upper = letter.toUpperCase();
  if (RU_ALPHABET.includes(upper)) {
    if (system === "pythagorean") return RU_PYTHAGOREAN_VALUES[upper] ?? 0;
    return [...(RU_TO_LATIN[upper] ?? "")].reduce((sum, latin) => sum + (CHALDEAN_VALUES[latin] ?? 0), 0);
  }
  const table = system === "pythagorean" ? PYTHAGOREAN_VALUES : CHALDEAN_VALUES;
  return table[upper] ?? 0;
}

export function isVowel(letter: string): boolean {
  const upper = letter.toUpperCase();
  return VOWELS.has(upper) || RU_VOWELS.has(upper);
}
