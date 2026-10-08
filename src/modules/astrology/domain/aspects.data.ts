import type { AspectType } from "./types";

export interface AspectDefinition {
  type: AspectType;
  angleDeg: number;
  /**
   * Упрощённый плоский орбис на тип аспекта: на практике он зависит от планеты, а для краткого обзора
   * натальной карты такая точность не нужна.
   */
  orbDeg: number;
  symbol: string;
  label: string;
  labelRu: string;
  meaning: string;
  meaningRu: string;
}

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
  {
    type: "conjunction",
    angleDeg: 0,
    orbDeg: 8,
    symbol: "☌",
    label: "Conjunction",
    labelRu: "Соединение",
    meaning: "these two blend into a single, hard-to-separate force",
    meaningRu: "эти две энергии сливаются в единую, трудно различимую силу",
  },
  {
    type: "sextile",
    angleDeg: 60,
    orbDeg: 5,
    symbol: "⚹",
    label: "Sextile",
    labelRu: "Секстиль",
    meaning: "these support each other, given a little effort",
    meaningRu: "эти энергии поддерживают друг друга, если приложить немного усилий",
  },
  {
    type: "square",
    angleDeg: 90,
    orbDeg: 7,
    symbol: "□",
    label: "Square",
    labelRu: "Квадрат",
    meaning: "these create productive friction — a tension worth working with",
    meaningRu: "эти энергии создают продуктивное трение — напряжение, с которым стоит работать",
  },
  {
    type: "trine",
    angleDeg: 120,
    orbDeg: 7,
    symbol: "△",
    label: "Trine",
    labelRu: "Трин",
    meaning: "these flow together easily, almost too easily",
    meaningRu: "эти энергии текут вместе легко — порой даже слишком легко",
  },
  {
    type: "opposition",
    angleDeg: 180,
    orbDeg: 8,
    symbol: "☍",
    label: "Opposition",
    labelRu: "Оппозиция",
    meaning: "these pull in opposite directions, asking for balance",
    meaningRu: "эти энергии тянут в разные стороны и просят баланса",
  },
];

export function localizeAspectDefinition(def: AspectDefinition, locale: "en" | "ru"): AspectDefinition {
  if (locale !== "ru") return def;
  return { ...def, label: def.labelRu, meaning: def.meaningRu };
}
