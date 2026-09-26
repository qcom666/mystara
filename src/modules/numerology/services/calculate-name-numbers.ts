import { getLetterValue, isRecognizedLetter, isVowel } from "../domain/letter-values.data";
import type { LifePathNumber, NumerologyProfile, NumerologySystem } from "../domain/types";
import { calculateBirthdayNumber, calculateLifePathNumber } from "./calculate-life-path";
import { reduceToNumerologyDigit } from "./numerology-math";

function lettersOf(name: string): string[] {
  return [...name.toUpperCase()].filter(isRecognizedLetter);
}

/**
 * Whether a name yields at least one letter with a value in *both* systems.
 * Callers must check this before computing name-derived numbers: a name with
 * nothing calculable (digits, emoji, a script we have no table for) sums to
 * 0, which is not a valid numerology number.
 */
export function hasCalculableLetters(name: string): boolean {
  return lettersOf(name).some((letter) => getLetterValue(letter, "pythagorean") > 0 && getLetterValue(letter, "chaldean") > 0);
}

function sumLetters(name: string, system: NumerologySystem, include: (letter: string) => boolean): number {
  return lettersOf(name)
    .filter(include)
    .reduce((sum, letter) => sum + getLetterValue(letter, system), 0);
}

/** Expression (Destiny) Number — every letter of the full birth name. What you're here to do. */
export function calculateExpressionNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, () => true));
}

/** Soul Urge (Heart's Desire) Number — vowels only. What you inwardly want. */
export function calculateSoulUrgeNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, isVowel));
}

/** Personality Number — consonants only. How others perceive you before they know you. */
export function calculatePersonalityNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, (letter) => !isVowel(letter)));
}

/** Maturity (Reality) Number — Life Path + Expression, reduced together. The self that emerges later in life. */
export function calculateMaturityNumber(lifePathNumber: number, expressionNumber: number): LifePathNumber {
  return reduceToNumerologyDigit(lifePathNumber + expressionNumber);
}

/**
 * Computes the full profile for one letter system. Life Path and Birthday
 * are date-only, so they're identical across systems — only the
 * name-derived numbers (Expression/Soul Urge/Personality/Maturity) differ
 * between Pythagorean and Chaldean.
 */
export function calculateNumerologyProfile(fullName: string, birthDate: Date, system: NumerologySystem): NumerologyProfile {
  const lifePathNumber = calculateLifePathNumber(birthDate);
  const expressionNumber = calculateExpressionNumber(fullName, system);

  return {
    system,
    lifePathNumber,
    birthdayNumber: calculateBirthdayNumber(birthDate),
    expressionNumber,
    soulUrgeNumber: calculateSoulUrgeNumber(fullName, system),
    personalityNumber: calculatePersonalityNumber(fullName, system),
    maturityNumber: calculateMaturityNumber(lifePathNumber, expressionNumber),
  };
}
