import type { LifePathNumber } from "../domain/types";
import { reduceToNumerologyDigit, sumDigits } from "./numerology-math";

/**
 * Стандартный алгоритм числа жизненного пути: «сложить все цифры даты рождения, затем свести» —
 * сводится до 1–9, кроме мастер-чисел (11/22/33), которые по нумерологической традиции остаются
 * как есть. Зависит только от даты, поэтому одинаково в халдейской и пифагорейской системах: они
 * различаются лишь числами по имени (см. calculate-name-numbers.ts).
 */
export function calculateLifePathNumber(birthDate: Date): LifePathNumber {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const total = sumDigits(day) + sumDigits(month) + sumDigits(year);
  return reduceToNumerologyDigit(total);
}

/**
 * Число дня рождения: просто число месяца, сведённое. Традиционно читается как «малый» талант
 * поверх числа жизненного пути.
 */
export function calculateBirthdayNumber(birthDate: Date): LifePathNumber {
  return reduceToNumerologyDigit(birthDate.getDate());
}
