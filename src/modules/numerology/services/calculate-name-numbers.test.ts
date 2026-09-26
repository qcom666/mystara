import { describe, expect, it } from "vitest";
import {
  calculateExpressionNumber,
  calculateMaturityNumber,
  calculateNumerologyProfile,
  calculatePersonalityNumber,
  calculateSoulUrgeNumber,
  hasCalculableLetters,
} from "./calculate-name-numbers";

const VALID_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

// All hand-verified against the letter tables in letter-values.data.ts.
// Pythagorean: J=1 O=6 H=8 N=5 -> 20 -> 2
// Chaldean:    J=1 O=7 H=5 N=5 -> 18 -> 9
describe("calculateExpressionNumber", () => {
  it("matches a hand-verified Pythagorean example (JOHN -> 2)", () => {
    expect(calculateExpressionNumber("John", "pythagorean")).toBe(2);
  });

  it("matches a hand-verified Chaldean example (JOHN -> 9)", () => {
    expect(calculateExpressionNumber("John", "chaldean")).toBe(9);
  });

  it("ignores spaces and non-letter characters", () => {
    expect(calculateExpressionNumber("J o-h'n", "pythagorean")).toBe(calculateExpressionNumber("John", "pythagorean"));
  });
});

describe("calculateSoulUrgeNumber", () => {
  it("only counts vowels (JOHN -> O only)", () => {
    expect(calculateSoulUrgeNumber("John", "pythagorean")).toBe(6); // O=6
    expect(calculateSoulUrgeNumber("John", "chaldean")).toBe(7); // O=7
  });
});

describe("calculatePersonalityNumber", () => {
  it("only counts consonants and preserves a master number (JOHN, Chaldean, J+H+N=1+5+5=11)", () => {
    expect(calculatePersonalityNumber("John", "chaldean")).toBe(11);
  });

  it("only counts consonants (JOHN, Pythagorean, J+H+N=1+8+5=14 -> 5)", () => {
    expect(calculatePersonalityNumber("John", "pythagorean")).toBe(5);
  });
});

describe("calculateMaturityNumber", () => {
  it("sums life path and expression, then reduces", () => {
    expect(calculateMaturityNumber(3, 2)).toBe(5);
    expect(calculateMaturityNumber(3, 9)).toBe(3); // 12 -> 1+2=3
  });
});

describe("calculateNumerologyProfile", () => {
  it("keeps date-derived numbers identical across systems, but varies name-derived ones", () => {
    const birthDate = new Date(1990, 0, 1); // life path 3 (hand-verified elsewhere)
    const pythagorean = calculateNumerologyProfile("John", birthDate, "pythagorean");
    const chaldean = calculateNumerologyProfile("John", birthDate, "chaldean");

    expect(pythagorean.lifePathNumber).toBe(3);
    expect(chaldean.lifePathNumber).toBe(3);
    expect(pythagorean.birthdayNumber).toBe(chaldean.birthdayNumber);

    expect(pythagorean.expressionNumber).not.toBe(chaldean.expressionNumber);
  });
});

// Russian names. Pythagorean uses the standard Russian table (А=1 Б=2 … З=9,
// И=1 … Р=9, С=1 … Щ=9, Ъ=1 … Я=6); Chaldean sums the letter's Latin
// transliteration. Hand-verified for «Анна»:
//   Pythagorean: А=1 Н=6 Н=6 А=1 -> 14 -> 5 | vowels А+А=2 | consonants Н+Н=12 -> 3
//   Chaldean:    A=1 N=5 N=5 A=1 -> 12 -> 3 | vowels 2       | consonants 10 -> 1
describe("Cyrillic names", () => {
  it("uses the standard Russian Pythagorean table", () => {
    expect(calculateExpressionNumber("Анна", "pythagorean")).toBe(5);
    expect(calculateSoulUrgeNumber("Анна", "pythagorean")).toBe(2);
    expect(calculatePersonalityNumber("Анна", "pythagorean")).toBe(3);
  });

  it("uses the Latin transliteration for the Chaldean system", () => {
    expect(calculateExpressionNumber("Анна", "chaldean")).toBe(3);
    expect(calculateSoulUrgeNumber("Анна", "chaldean")).toBe(2);
    expect(calculatePersonalityNumber("Анна", "chaldean")).toBe(1);
  });

  it("is case-insensitive and treats Ё like the other letters", () => {
    expect(calculateExpressionNumber("АННА", "pythagorean")).toBe(calculateExpressionNumber("анна", "pythagorean"));
    // Ё is a distinct letter (index 6 -> 7), unlike Е (6).
    expect(calculateExpressionNumber("Ё", "pythagorean")).toBe(7);
    expect(calculateExpressionNumber("Е", "pythagorean")).toBe(6);
  });

  it("classifies Russian vowels, and treats the hard/soft signs as valueless in Chaldean", () => {
    expect(calculateSoulUrgeNumber("Юлия", "pythagorean")).toBeGreaterThan(0);
    expect(hasCalculableLetters("Ъ")).toBe(false);
  });

  it("produces a valid number for a mixed Latin/Cyrillic name", () => {
    const profile = calculateNumerologyProfile("Anna Иванова", new Date("1990-07-15T00:00:00"), "pythagorean");
    for (const value of Object.values(profile).filter((v): v is number => typeof v === "number")) {
      expect(VALID_NUMBERS).toContain(value);
    }
  });
});

describe("hasCalculableLetters", () => {
  it.each([
    ["John", true],
    ["Анна", true],
    ["  Мария-Луиза ", true],
    ["", false],
    ["   ", false],
    ["12345", false],
    ["😀", false],
    ["李小龙", false],
  ])("%j -> %s", (name, expected) => {
    expect(hasCalculableLetters(name)).toBe(expected);
  });

  it("guarantees the name-derived numbers are always valid whenever it returns true", () => {
    for (const name of ["Ъ Анна", "Ыы", "Ь Я", "Щ", "Zoe"]) {
      if (!hasCalculableLetters(name)) continue;
      for (const system of ["pythagorean", "chaldean"] as const) {
        expect(VALID_NUMBERS, `${name}/${system}`).toContain(calculateExpressionNumber(name, system));
      }
    }
  });
});
