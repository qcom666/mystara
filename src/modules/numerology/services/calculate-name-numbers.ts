import { getLetterValue, isRecognizedLetter, isVowel } from "../domain/letter-values.data";
import type { LifePathNumber, NumerologyProfile, NumerologySystem } from "../domain/types";
import { calculateBirthdayNumber, calculateLifePathNumber } from "./calculate-life-path";
import { reduceToNumerologyDigit } from "./numerology-math";

function lettersOf(name: string): string[] {
  return [...name.toUpperCase()].filter(isRecognizedLetter);
}

/**
 * Даёт ли имя хотя бы одну букву со значением в *обеих* системах. Вызывающий код должен проверить
 * это до расчёта чисел по имени: имя, в котором нечего считать (цифры, эмодзи, письмо, для которого
 * нет таблицы), даёт сумму 0, а это не допустимое нумерологическое число.
 */
export function hasCalculableLetters(name: string): boolean {
  return lettersOf(name).some((letter) => getLetterValue(letter, "pythagorean") > 0 && getLetterValue(letter, "chaldean") > 0);
}

function sumLetters(name: string, system: NumerologySystem, include: (letter: string) => boolean): number {
  return lettersOf(name)
    .filter(include)
    .reduce((sum, letter) => sum + getLetterValue(letter, system), 0);
}

/** Число выражения (судьбы): все буквы полного имени при рождении. Для чего вы здесь. */
export function calculateExpressionNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, () => true));
}

/** Число души (желания сердца): только гласные. Чего вы желаете внутри. */
export function calculateSoulUrgeNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, isVowel));
}

/** Число личности: только согласные. Как вас воспринимают, пока не знают. */
export function calculatePersonalityNumber(fullName: string, system: NumerologySystem): LifePathNumber {
  return reduceToNumerologyDigit(sumLetters(fullName, system, (letter) => !isVowel(letter)));
}

/**
 * Число зрелости (реализации): число жизненного пути + число выражения, сведённые вместе.
 * Личность, которая проявляется позже в жизни.
 */
export function calculateMaturityNumber(lifePathNumber: number, expressionNumber: number): LifePathNumber {
  return reduceToNumerologyDigit(lifePathNumber + expressionNumber);
}

/**
 * Считает полный профиль для одной системы букв. Число жизненного пути и число дня рождения зависят
 * только от даты, поэтому одинаковы в обеих системах; различаются только числа по имени
 * (выражение/душа/личность/зрелость) между пифагорейской и халдейской.
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
