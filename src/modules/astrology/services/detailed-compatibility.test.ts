import { describe, expect, it } from "vitest";
import { FRIENDSHIP_ASPECTS, LOVE_ASPECTS } from "../domain/compatibility-details.data";
import { getAllZodiacSigns } from "../domain/zodiac-signs.data";
import { compatibilityPath, type CompatibilityMode, getDetailedCompatibility, scoreBand, topPairs } from "./detailed-compatibility";

const SIGNS = getAllZodiacSigns().map((sign) => sign.id);
const MODES: CompatibilityMode[] = ["love", "friendship"];

describe("подробная совместимость", () => {
  it("симметрична, определена для всех пар и в обоих режимах держится в границах шкалы", () => {
    for (const mode of MODES) {
      const definitions = mode === "love" ? LOVE_ASPECTS : FRIENDSHIP_ASPECTS;
      for (const a of SIGNS) {
        for (const b of SIGNS) {
          const result = getDetailedCompatibility(a, b, mode);
          expect(result).toEqual(getDetailedCompatibility(b, a, mode));
          expect(result.aspects.map((aspect) => aspect.id)).toEqual(definitions.map((definition) => definition.id));
          expect(result.overall).toBeGreaterThanOrEqual(38);
          expect(result.overall).toBeLessThanOrEqual(98);
          for (const aspect of result.aspects) {
            expect(aspect.score).toBeGreaterThanOrEqual(25);
            expect(aspect.score).toBeLessThanOrEqual(98);
            expect(aspect.band).toBe(scoreBand(aspect.score));
            expect(aspect.text.ru.length).toBeGreaterThan(20);
            expect(aspect.text.en.length).toBeGreaterThan(20);
          }
        }
      }
    }
  });

  it("уровни пунктов: от 75 % — высокий, от 55 % — средний", () => {
    expect(scoreBand(75)).toBe("high");
    expect(scoreBand(74)).toBe("mid");
    expect(scoreBand(55)).toBe("mid");
    expect(scoreBand(54)).toBe("low");
  });

  it("трин одной стихии выше квадрата и квинконса — и в любви, и в дружбе", () => {
    for (const mode of MODES) {
      const trine = getDetailedCompatibility("aries", "leo", mode).overall;
      expect(trine).toBeGreaterThan(getDetailedCompatibility("aries", "cancer", mode).overall);
      expect(trine).toBeGreaterThan(getDetailedCompatibility("aries", "virgo", mode).overall);
    }
  });

  it("оценки различаются: пары не сливаются в одно число", () => {
    for (const mode of MODES) {
      const overall = new Set<number>();
      for (const a of SIGNS) for (const b of SIGNS) overall.add(getDetailedCompatibility(a, b, mode).overall);
      expect(overall.size).toBeGreaterThan(20);
      expect(Math.max(...overall) - Math.min(...overall)).toBeGreaterThan(35);
    }
  });

  it("сильные стороны — три лучших пункта, зоны роста — три слабых, вердикт по порогам", () => {
    const result = getDetailedCompatibility("gemini", "virgo", "love");
    const sorted = [...result.aspects].sort((x, y) => y.score - x.score);
    expect(result.strengths.map((aspect) => aspect.score)).toEqual(sorted.slice(0, 3).map((aspect) => aspect.score));
    expect(result.growth.map((aspect) => aspect.score)).toEqual(sorted.slice(-3).reverse().map((aspect) => aspect.score));
    expect(getDetailedCompatibility("cancer", "scorpio", "love").verdict.ru).toBe("Созданы друг для друга");
  });

  it("адреса страниц и подборка лучших пар", () => {
    expect(compatibilityPath("love", "leo", "aries")).toBe("/astrology/compatibility/aries-leo");
    expect(compatibilityPath("friendship", "leo", "aries")).toBe("/astrology/compatibility/friendship/aries-leo");
    for (const mode of MODES) {
      const best = topPairs(mode, 6);
      expect(best).toHaveLength(6);
      expect(best.every((pair) => pair.first !== pair.second)).toBe(true);
      expect(best.map((pair) => pair.overall)).toEqual([...best.map((pair) => pair.overall)].sort((x, y) => y - x));
    }
  });
});
