import { describe, expect, it } from "vitest";
import { getAllZodiacSigns } from "../domain/zodiac-signs.data";
import { allCompatibilitySlugs, compatibilitySlug, getCompatibility, parseCompatibilitySlug, signDistance } from "./compatibility";

const SIGNS = getAllZodiacSigns().map((sign) => sign.id);

describe("совместимость знаков", () => {
  it("симметрична и определена для всех 144 пар", () => {
    for (const a of SIGNS) {
      for (const b of SIGNS) {
        const ab = getCompatibility(a, b);
        expect(ab).toEqual(getCompatibility(b, a));
        for (const value of Object.values(ab.scores)) expect(value).toBeGreaterThanOrEqual(20);
        for (const value of Object.values(ab.scores)) expect(value).toBeLessThanOrEqual(98);
        for (const text of [ab.title, ab.summary, ab.elements, ab.modalities, ab.advice]) {
          expect(text.en.length).toBeGreaterThan(5);
          expect(text.ru.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it("расстояние по кругу: трин, оппозиция, соседи", () => {
    expect(signDistance("aries", "leo")).toBe(4);
    expect(signDistance("aries", "libra")).toBe(6);
    expect(signDistance("pisces", "aries")).toBe(1);
    expect(signDistance("taurus", "taurus")).toBe(0);
  });

  it("трин одной стихии выше квинконса", () => {
    expect(getCompatibility("aries", "leo").scores.overall).toBeGreaterThan(getCompatibility("aries", "virgo").scores.overall);
  });

  it("адреса страниц: 78 канонических пар, обратный порядок разбирается", () => {
    const slugs = allCompatibilitySlugs();
    expect(slugs).toHaveLength(78);
    expect(new Set(slugs).size).toBe(78);
    expect(compatibilitySlug("leo", "aries")).toBe("aries-leo");
    expect(parseCompatibilitySlug("leo-aries")).toEqual(["leo", "aries"]);
    for (const bad of ["leo", "leo-cat", "aries-leo-virgo", ""]) expect(parseCompatibilitySlug(bad)).toBeNull();
  });
});
