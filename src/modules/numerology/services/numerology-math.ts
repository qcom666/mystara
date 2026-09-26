import type { LifePathNumber } from "../domain/types";

const MASTER_NUMBERS = new Set([11, 22, 33]);

export function sumDigits(value: number): number {
  return String(Math.abs(value))
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

/** Reduces to a single digit, except master numbers (11/22/33) which are never reduced further — shared by every numerology calculation in this module. */
export function reduceToNumerologyDigit(value: number): LifePathNumber {
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.has(current)) {
    current = sumDigits(current);
  }
  return current as LifePathNumber;
}
