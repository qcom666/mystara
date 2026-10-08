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

// Всё проверено вручную по таблицам букв из letter-values.data.ts.
// Пифагорейская: J=1 O=6 H=8 N=5 -> 20 -> 2
// Халдейская:    J=1 O=7 H=5 N=5 -> 18 -> 9
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
    expect(calculateMaturityNumber(3, 9)).toBe(3); // 12 → 1+2=3
  });
});

describe("calculateNumerologyProfile", () => {
  it("keeps date-derived numbers identical across systems, but varies name-derived ones", () => {
    const birthDate = new Date(1990, 0, 1); // число жизненного пути 3 (проверено вручную в другом месте)
    const pythagorean = calculateNumerologyProfile("John", birthDate, "pythagorean");
    const chaldean = calculateNumerologyProfile("John", birthDate, "chaldean");

    expect(pythagorean.lifePathNumber).toBe(3);
    expect(chaldean.lifePathNumber).toBe(3);
    expect(pythagorean.birthdayNumber).toBe(chaldean.birthdayNumber);

    expect(pythagorean.expressionNumber).not.toBe(chaldean.expressionNumber);
  });
});

// Русские имена. Пифагорейская система использует стандартную русскую таблицу (А=1 Б=2 … З=9,
// И=1 … Р=9, С=1 … Щ=9, Ъ=1 … Я=6); халдейская складывает значения латинской транслитерации буквы.
// Проверено вручную для «Анна»:
//   Пифагорейская: А=1 Н=6 Н=6 А=1 -> 14 -> 5 | гласные А+А=2 | согласные Н+Н=12 -> 3
//   Халдейская:    A=1 N=5 N=5 A=1 -> 12 -> 3 | гласные 2       | согласные 10 -> 1
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
    // Ё — отдельная буква (индекс 6 -> 7), в отличие от Е (6).
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
