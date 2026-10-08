import { en, type Dictionary } from "./en";
import { ru } from "./ru";

export type { Dictionary };

const dictionaries = { en, ru };

export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = "en";
export const locales: Locale[] = ["en", "ru"];
export const localeLabels: Record<Locale, string> = { en: "EN", ru: "RU" };

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "ru";
}

/**
 * У русского три формы множественного числа (1 X / 2–4 Y / 5+ Z, с обычным исключением для 11–14,
 * например 11 карт, а не 11 карта); у английского только две. Хранится здесь, рядом со словарями,
 * а не реализуется заново в каждом месте вызова.
 */
function pluralizeRu(count: number, [one, few, many]: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function formatCardCount(count: number, locale: Locale): string {
  if (locale === "ru") return `${count} ${pluralizeRu(count, ["карта", "карты", "карт"])}`;
  return `${count} card${count === 1 ? "" : "s"}`;
}

export function formatReadingsPerDay(count: number, locale: Locale): string {
  if (locale === "ru") return `${count} ${pluralizeRu(count, ["расклад в день", "расклада в день", "раскладов в день"])}`;
  return `${count} reading${count === 1 ? "" : "s"} per day`;
}
