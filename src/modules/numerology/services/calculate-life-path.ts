import type { LifePathNumber } from "../domain/types";
import { reduceToNumerologyDigit, sumDigits } from "./numerology-math";

/**
 * Standard "sum every digit of the birth date, then reduce" life path
 * algorithm — reduces to 1–9 unless it lands on a master number (11/22/33),
 * which is kept as-is per numerology convention. Date-based, so it's the
 * same in both the Chaldean and Pythagorean systems — those only differ on
 * name-derived numbers (see calculate-name-numbers.ts).
 */
export function calculateLifePathNumber(birthDate: Date): LifePathNumber {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const total = sumDigits(day) + sumDigits(month) + sumDigits(year);
  return reduceToNumerologyDigit(total);
}

/**
 * The Birthday Number — just the day of the month, reduced. Traditionally
 * read as a "minor" talent layered on top of the Life Path Number.
 */
export function calculateBirthdayNumber(birthDate: Date): LifePathNumber {
  return reduceToNumerologyDigit(birthDate.getDate());
}
