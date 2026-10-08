import type { LifePathNumber } from "../domain/types";

const MASTER_NUMBERS = new Set([11, 22, 33]);

export function sumDigits(value: number): number {
  return String(Math.abs(value))
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

/**
 * Сводит к одной цифре, кроме мастер-чисел (11/22/33), которые никогда не сводятся дальше;
 * общая функция для всех нумерологических расчётов модуля.
 */
export function reduceToNumerologyDigit(value: number): LifePathNumber {
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.has(current)) {
    current = sumDigits(current);
  }
  return current as LifePathNumber;
}
